import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { IHealthService, HealthServiceStatus } from "src/application/services/health-service.repository";
import { HealthCheckService } from "src/infrastructure/health/health-check.service";
import { ConnectionManager } from "src/infrastructure/health/connection-manager";
import { ServiceDisconnectedCounter } from "src/infrastructure/observability/prometheus/prometheus-metrics";
import { LokiServiceImpl } from "src/infrastructure/observability/loki/loki.service.impl";
import { ILoggerRepository } from "src/application/services/logger.repository";
import { NestLogServiceImpl } from "src/infrastructure/observability/nestLog/nestlog.service.impl";

@Injectable()
export class RedisServiceImpl implements IHealthService, OnModuleInit, OnModuleDestroy {
	private readonly connectionName = "redis";

	private logger: ILoggerRepository | null = null;

	constructor(
		private readonly healthCheck: HealthCheckService,
		private readonly connectionManager: ConnectionManager
	) {}

	async onModuleInit() {

		this.logger = await this.connectionManager.getConnection<ILoggerRepository>("log", async () => new NestLogServiceImpl())

		// Registra no health check
		this.healthCheck.register(this.connectionName, this);
	}

	async onModuleDestroy() {
		await this.connectionManager.disconnect(this.connectionName);
	}

	/**
	 * Health check com connection manager
	 */
	async isHealth(): Promise<HealthServiceStatus> {
		try {
			// Tenta obter conexão existente ou criar nova
			const redis = await this.connectionManager.getConnection<Redis>(
				this.connectionName,
				() => this.createRedisConnection(),
				{
					connectionTimeout: 3000,
					maxRetries: 2,
					retryDelay: 1000
				}
			);

			if (!redis) {
				return "UnHealth";
			}

			// Valida se conexão ainda está ativa
			const isValid = await this.connectionManager.validateConnection<Redis>(
				this.connectionName,
				async (connection) => {
					const result = await Promise.race([
						connection.ping(),
						new Promise<never>((_, reject) => 
							setTimeout(() => reject(new Error('Ping timeout')), 2000)
						)
					]);
					return result === 'PONG';
				}
			);

			return isValid ? "Health" : "UnHealth";

		} catch (error) {
			this.logger?.register("Error", "REDIS_SERVICE", {
				action: "health_check_failed",
				error: error.message,
				timestamp: new Date().toISOString()
			});
			return "UnHealth";
		}
	}

	/**
	 * Obtém serviço Redis se estiver healthy
	 */
	async getService<T>(): Promise<T | null> {
		const healthStatus = await this.isHealth();
		
		if (healthStatus !== "Health") {
			return null;
		}

		// Retorna conexão do cache se estiver healthy
		const redis = await this.connectionManager.getConnection<Redis>(
			this.connectionName,
			() => this.createRedisConnection()
		);

		return redis as T;
	}

	/**
	 * Obtém conexão Redis APENAS se estiver healthy (para BullMQ)
	 */
	async getHealthyConnection(): Promise<Redis | null> {
		try {
			const healthStatus = await this.isHealth();
			if (healthStatus !== "Health") {
				return null;
			}

			return await this.getService<Redis>();
		} catch (error) {
			this.logger?.register("Error", "REDIS_SERVICE", {
				action: "get_healthy_connection_failed",
				error: error.message,
				timestamp: new Date().toISOString()
			});
			return null;
		}
	}

	/**
	 * Factory para criar nova conexão Redis
	 */
	private async createRedisConnection(): Promise<Redis> {
		this.logger?.register("Info", "REDIS_SERVICE", {
			action: "creating_connection",
			host: process.env.REDIS_HOST ?? "localhost",
			port: Number(process.env.REDIS_PORT) || 6379,
			timestamp: new Date().toISOString()
		});

		const redis = new Redis({
			host: process.env.REDIS_HOST ?? "localhost",
			port: Number(process.env.REDIS_PORT) || 6379,
			password: process.env.REDIS_PASSWORD,
			
			// DESABILITA reconnect automático do ioredis - nós gerenciamos isso
			maxRetriesPerRequest: null,
			enableAutoPipelining: false,
			
			// Timeouts agressivos
			lazyConnect: true,
			connectTimeout: 2000,
			commandTimeout: 1500,
			
			// CRÍTICO: Desabilita reconnect automático
			reconnectOnError: () => false, // Nunca reconecta automaticamente
			
		});

		// Event listeners - SEM scheduleReconnection para evitar loops
		redis.on("error", (err) => {
			this.logger?.register("Error", "REDIS_SERVICE", {
				action: "connection_error",
				error: err.message,
				timestamp: new Date().toISOString()
			});
		});

		redis.on("connect", () => {
			this.logger?.register("Info", "REDIS_SERVICE", {
				action: "connected",
				timestamp: new Date().toISOString()
			});
		});

		redis.on("close", () => {
			this.logger?.register("Info", "REDIS_SERVICE", {
				action: "connection_closed",
				timestamp: new Date().toISOString()
			});

			this.connectionManager.disconnect(this.connectionName);

		});

		redis.on("end", () => {
			this.logger?.register("Info", "REDIS_SERVICE", {
				action: "connection_ended",
				timestamp: new Date().toISOString()
			});
		});

		// Força conexão inicial com timeout
		await Promise.race([
			redis.connect(),
			new Promise<never>((_, reject) => 
				setTimeout(() => reject(new Error('Initial connection timeout')), 3000)
			)
		]);
		
		this.logger?.register("Info", "REDIS_SERVICE", {
			action: "connection_established",
			timestamp: new Date().toISOString()
		});

		return redis;
	}

	/**
	 * Método para forçar reset da conexão
	 */
	async resetConnection(): Promise<void> {
		this.logger?.register("Info", "REDIS_SERVICE", {
			action: "resetting_connection",
			timestamp: new Date().toISOString()
		});
		await this.connectionManager.disconnect(this.connectionName);
	}
}