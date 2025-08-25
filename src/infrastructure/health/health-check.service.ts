import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { IHealthService, HealthServiceStatus } from "src/application/services/health-service.repository";
import { ServiceDisconnectedCounter, ServiceErrorCounter } from "../observability/prometheus/prometheus-metrics";
import { ILoggerRepository } from "src/application/services/logger.repository";
import { ConnectionManager } from "./connection-manager";
import { NestLogServiceImpl } from "../observability/nestLog/nestlog.service.impl";
//import { LokiServiceImpl } from "../observability/loki/loki.service.impl";
//import { ConnectionManager } from "./connection-manager";
//import LokiTransport from "winston-loki";

export type ServiceStatus = "Health" | "UnHealth";

export interface IService<TService extends IHealthService = IHealthService> {
	name: string;
	service: TService;
	status: ServiceStatus;
	lastCheck: Date;
	consecutiveFailures: number;
	nextCheckAt: Date;
	lastError?: string;
}

export interface RetryConfig {
	maxAttempts: number;
	initialDelay: number;
	maxDelay: number;
	backoffMultiplier: number;
}

/**
 * Serviço melhorado para health check com cache, reconexão assíncrona e circuit breaker
 */
@Injectable()
export class HealthCheckService {
	private services: Map<string, IService> = new Map();
	private reconnectionQueue: Set<string> = new Set();
	private isBackgroundMonitorRunning = false;

	private logger: ILoggerRepository | null = null;

	private readonly defaultRetryConfig: RetryConfig = {
		maxAttempts: 30,
		initialDelay: 2000,
		maxDelay: 30000,
		backoffMultiplier: 1.5
	};

	constructor(
		private readonly connectionManager: ConnectionManager
	) {}

	register(name: string, service: IHealthService) {

		this.services.set(name, {
			name,
			service,
			status: "UnHealth",
			lastCheck: new Date(0), // Force initial check
			consecutiveFailures: 0,
			nextCheckAt: new Date(),
		});
	}

	remove(name: string) {
		this.services.delete(name);
		this.reconnectionQueue.delete(name);
	}

	getService<T extends IHealthService>(name: string): IService<T> | null {
		return this.services.get(name) as IService<T> ?? null;
	}

	/**
	 * Retorna status em cache (super rápido) - usado pelo Guard
	 */
	getCachedStatus(): IService[] {
		return Array.from(this.services.values());
	}

	/**
	 * Força check de um serviço específico com timeout agressivo
	 */
	async checkServiceWithTimeout(serviceName: string, timeoutMs: number = 2000): Promise<HealthServiceStatus> {
		const serviceInfo = this.services.get(serviceName);
		if (!serviceInfo) return "UnHealth";

		try {
			const healthPromise = serviceInfo.service.isHealth();
			const timeoutPromise = new Promise<HealthServiceStatus>((_, reject) => 
				setTimeout(() => reject(new Error('Health check timeout')), timeoutMs)
			);

			const result = await Promise.race([healthPromise, timeoutPromise]);
			
			// Update cache
			serviceInfo.status = result;
			serviceInfo.lastCheck = new Date();
			serviceInfo.consecutiveFailures = result === "Health" ? 0 : serviceInfo.consecutiveFailures + 1;
			serviceInfo.nextCheckAt = this.calculateNextCheck(serviceInfo.consecutiveFailures);
			
			return result;
		} catch (error) {
			serviceInfo.status = "UnHealth";
			serviceInfo.lastCheck = new Date();
			serviceInfo.consecutiveFailures++;
			serviceInfo.lastError = error.message;
			serviceInfo.nextCheckAt = this.calculateNextCheck(serviceInfo.consecutiveFailures);
			
			// this.logger.register("Error", "HEALTH_CHECK", {
			// 	service: serviceName,
			// 	action: "check_with_timeout_failed",
			// 	error: error.message,
			// 	consecutiveFailures: serviceInfo.consecutiveFailures,
			// 	timestamp: new Date().toISOString()
			// });
			

			this.logger = await this.connectionManager.getConnection<ILoggerRepository>("log", async () => new NestLogServiceImpl())

			return "UnHealth";
		}
	}

	/**
	 * Schedule reconexão assíncrona sem bloquear
	 */
	scheduleReconnection(serviceName: string) {
		const serviceInfo = this.services.get(serviceName);
		if (!serviceInfo) return;

		// Throttling: evita spam de reconnection
		if (this.reconnectionQueue.has(serviceName)) {
			return; // Já está na fila
		}

		// Se tem muitas falhas consecutivas, throttle mais agressivamente
		const throttleDelay = Math.min(1000 * serviceInfo.consecutiveFailures, 15000);
		
		setTimeout(() => {
			if (!this.reconnectionQueue.has(serviceName)) {
				this.reconnectionQueue.add(serviceName);
				this.logger?.register("Warn", "HEALTH_CHECK", {
					service: serviceName,
					action: "scheduled_reconnection",
					failures: serviceInfo.consecutiveFailures,
					throttleDelay,
					timestamp: new Date().toISOString()
				});
			}
		}, throttleDelay);
		
		// Start background monitor if not running
		if (!this.isBackgroundMonitorRunning) {
			this.startBackgroundMonitor();
		}
	}

	/**
	 * Background monitor que tenta reconectar serviços falhos
	 */
	private async startBackgroundMonitor() {
		if (this.isBackgroundMonitorRunning) return;
		
		this.isBackgroundMonitorRunning = true;
		this.logger?.register("Info", "HEALTH_CHECK", {
			action: "background_monitor_started",
			timestamp: new Date().toISOString()
		});

		const monitorLoop = async () => {
			while (this.isBackgroundMonitorRunning) {
				try {
					// Process reconnection queue (com limit para evitar sobrecarga)
					if (this.reconnectionQueue.size > 0) {
						const servicesToReconnect = Array.from(this.reconnectionQueue).slice(0, 3); // Max 3 por vez
						
						// Remove da queue os que vamos processar
						servicesToReconnect.forEach(service => this.reconnectionQueue.delete(service));

						// Process em paralelo mas com limit
						await Promise.allSettled(
							servicesToReconnect.map(serviceName => this.attemptReconnection(serviceName))
						);
					}

					// Check services that are due for check (menos frequente)
					if (Math.random() > 0.7) { // 30% de chance a cada ciclo
						await this.checkOverdueServices();
					}

					// Wait mais tempo se não há trabalho
					const waitTime = this.reconnectionQueue.size > 0 ? 8000 : 15000;
					await new Promise(resolve => setTimeout(resolve, waitTime));
					
				} catch (error) {
					this.logger?.register("Error", "HEALTH_CHECK", {
						action: "background_monitor_error",
						error: error.message,
						timestamp: new Date().toISOString()
					});
					await new Promise(resolve => setTimeout(resolve, 20000)); // Wait mais em caso de erro
				}
			}
		};

		monitorLoop();
	}

	/**
	 * Tenta reconectar um serviço específico
	 */
	private async attemptReconnection(serviceName: string) {
		const serviceInfo = this.services.get(serviceName);
		if (!serviceInfo) return;

		// Circuit breaker: se muitas falhas consecutivas, wait mais tempo
		if (serviceInfo.consecutiveFailures > 5) {
			this.logger?.register("Warn", "HEALTH_CHECK", {
				service: serviceName,
				action: "circuit_breaker_activated",
				failures: serviceInfo.consecutiveFailures,
				timestamp: new Date().toISOString()
			});
			
			// Backoff agressivo para serviços muito problemáticos
			serviceInfo.nextCheckAt = new Date(Date.now() + (30000 * Math.min(serviceInfo.consecutiveFailures - 5, 5))); // Max 5 min
			return;
		}

		// Check if it's time to retry
		if (new Date() < serviceInfo.nextCheckAt) {
			return;
		}

		this.logger?.register("Info", "HEALTH_CHECK", {
			service: serviceName,
			action: "attempting_reconnection",
			timestamp: new Date().toISOString()
		});
		
		try {
			const status = await this.checkServiceWithTimeout(serviceName, 4000);
			
			if (status === "Health") {
				serviceInfo.consecutiveFailures = 0; // Reset counter
				this.logger?.register("Info", "HEALTH_CHECK", {
					service: serviceName,
					action: "reconnection_successful",
					timestamp: new Date().toISOString()
				});
			} else {
				ServiceDisconnectedCounter.inc({
					service: serviceName
				})
				// Re-queue for retry with longer delay
				setTimeout(() => {
					this.scheduleReconnection(serviceName);
				}, 5000);
			}
		} catch (error) {
			this.logger?.register("Error", "HEALTH_CHECK", {
				service: serviceName,
				action: "reconnection_failed",
				error: error.message,
				timestamp: new Date().toISOString()
			});

			ServiceErrorCounter.inc({
				service: serviceName
			})
			serviceInfo.lastError = error.message;
			
			// Re-queue for retry with exponential backoff
			setTimeout(() => {
				this.scheduleReconnection(serviceName);
			}, Math.min(2000 * serviceInfo.consecutiveFailures, 30000));
		}
	}

	/**
	 * Check services que estão na hora de verificar
	 */
	private async checkOverdueServices() {
		const now = new Date();
		
		for (const [name, serviceInfo] of this.services) {
			// Only check services that are overdue and not in reconnection queue
			if (now >= serviceInfo.nextCheckAt && !this.reconnectionQueue.has(name)) {
				await this.checkServiceWithTimeout(name, 3000);
			}
		}
	}

	/**
	 * Calcula próximo check baseado em backoff exponencial
	 */
	private calculateNextCheck(consecutiveFailures: number): Date {
		const delay = Math.min(
			this.defaultRetryConfig.initialDelay * Math.pow(this.defaultRetryConfig.backoffMultiplier, consecutiveFailures),
			this.defaultRetryConfig.maxDelay
		);
		
		return new Date(Date.now() + delay);
	}

	/**
	 * Para o background monitor
	 */
	stopBackgroundMonitor() {
		this.isBackgroundMonitorRunning = false;
		this.logger?.register("Info", "HEALTH_CHECK", {
			action: "background_monitor_stopped",
			timestamp: new Date().toISOString()
		});
	}

	/**
	 * Startup: espera todos os serviços ficarem healthy
	 */
	async waitServices(): Promise<void> {
		this.logger?.register("Info", "HEALTH_CHECK", {
			action: "service_health_verification_started",
			timestamp: new Date().toISOString()
		});

		for (const [key, value] of this.services) {
			let attempts = 0;
			let delay = this.defaultRetryConfig.initialDelay;
			let connected = false;

			while (attempts < this.defaultRetryConfig.maxAttempts && !connected) {
				attempts++;
				this.logger?.register("Info", "HEALTH_CHECK", {
					service: key,
					action: "connection_attempt",
					attempt: attempts,
					timestamp: new Date().toISOString()
				});

				try {
					const ok = await value.service.isHealth();
					if (ok == "Health") {
						value.status = "Health";
						value.lastCheck = new Date();
						value.consecutiveFailures = 0;
						this.logger?.register("Info", "HEALTH_CHECK", {
							service: key,
							action: "connection_successful",
							timestamp: new Date().toISOString()
						});
						connected = true;
						break;
					}
				} catch (err) {
					this.logger?.register("Error", "HEALTH_CHECK", {
						service: key,
						action: "connection_failed",
						error: err.message,
						timestamp: new Date().toISOString()
					});
				}

				// Wait before next attempt
				await new Promise(res => setTimeout(res, delay));

				// Apply exponential backoff
				delay = Math.min(
					delay * this.defaultRetryConfig.backoffMultiplier,
					this.defaultRetryConfig.maxDelay
				);
			}

			if (!connected) {
				value.status = "UnHealth";
				value.consecutiveFailures = attempts;
				this.logger?.register("Error", "HEALTH_CHECK", {
					service: key,
					action: "connection_failed_after_all_attempts",
					attempts,
					timestamp: new Date().toISOString()
				});
			}
		}

		// Start background monitor after initial setup
		this.startBackgroundMonitor();
	}

	/**
	 * Check completo de todos os serviços (usado pela rota /health)
	 */
	async checkAllServices(): Promise<IService[]> {
		const services: IService[] = [];

		for (const [name, value] of this.services) {
			try {
				const status = await this.checkServiceWithTimeout(name, 3000);
				services.push({
					name,
					service: value.service,
					status,
					lastCheck: value.lastCheck,
					consecutiveFailures: value.consecutiveFailures,
					nextCheckAt: value.nextCheckAt,
					lastError: value.lastError
				});
			} catch (err) {
				services.push({
					name,
					service: value.service,
					status: "UnHealth",
					lastCheck: new Date(),
					consecutiveFailures: value.consecutiveFailures + 1,
					nextCheckAt: value.nextCheckAt,
					lastError: err.message
				});
			}
		}

		return services;
	}

	/**
	 * Status resumido para métricas
	 */
	getHealthSummary(): { healthy: number; unhealthy: number; total: number } {
		const services = Array.from(this.services.values());
		return {
			healthy: services.filter(s => s.status === "Health").length,
			unhealthy: services.filter(s => s.status === "UnHealth").length,
			total: services.length
		};
	}
}