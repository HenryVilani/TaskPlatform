import LokiTransport from "winston-loki";
import { createLogger, Logger } from "winston"
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ILoggerRepository, LoggerType } from "src/application/services/logger.repository";
import { LokiBaseServiceImpl } from "./loki.health";

/**
 * LokiServiceImpl with Automatic Retry
 *
 * Implements an intelligent fallback strategy:
 * 1. Always uses NestJS Logger as a fallback
 * 2. Attempts to connect to Loki in the background
 * 3. Automatic retry at increasing intervals
 * 4. Continuous health monitoring
 * 
 * @export
 * @class LokiServiceImpl
 * @implements {ILoggerRepository}
 * @implements {OnModuleInit}
 * @implements {OnModuleDestroy}
 */
@Injectable()
export class LokiServiceImpl implements ILoggerRepository, OnModuleInit, OnModuleDestroy {

	/**
	 * Winston logger with Loki (when available)
	 */
	private lokiLogger: Logger | null = null;

	/**
	 * NestJS Logger (always available)
	 */
	private nestLogger = new (require('@nestjs/common')).Logger('LokiService');

	/**
	 * Loki connection status
	 */
	private lokiStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';

	/**
	 * Timer for automatic retry
	 */
	private retryTimer: NodeJS.Timeout | null = null;

	/**
	 * Retry configuration
	 */
	private retryConfig = {
		initialDelay: 5000,
		maxDelay: 300000,
		backoffMultiplier: 1.5,
		maxAttempts: 0,
		currentAttempt: 0,
		currentDelay: 5000
	};

	/**
	 * Flag to control whether to continue trying
	 */
	private shouldRetry = true;

	constructor(
		private readonly lokiService: LokiBaseServiceImpl
	) {}

	async onModuleInit() {
		this.nestLogger.log('Initializing Loki Service with Automatic Retry...');
		
		this.nestLogger.log('NestJS Logger initialized (active fallback)');

		await this.attemptLokiConnection();

		this.startBackgroundRetry();
	}

	/**
	 * Cleanup do módulo
	 */
	async onModuleDestroy() {
		this.shouldRetry = false;
		
		if (this.retryTimer) {
			clearTimeout(this.retryTimer);
			this.retryTimer = null;
		}

		if (this.lokiLogger) {
			try {
				// Winston não tem método close direto, mas podemos remover transports
				this.lokiLogger.clear();
				this.lokiLogger = null;
			} catch (error) {
				this.nestLogger.error(`Error to close Loki logger: ${error.message}`);
			}
		}

		this.nestLogger.log('Loki Service Completed');
	}

	/**
	 * Main method for logging
	 * Always works, using Loki when available or NestJS as a fallback
	 */
	register(type: LoggerType, id: string, data: object) {
		const logMessage = { id, ...data, timestamp: new Date().toISOString() };

		this.logToNest(type, id, logMessage);

		if (this.lokiStatus === 'connected' && this.lokiLogger) {

			try {
				this.logToLoki(type, id, logMessage);
			} catch (error) {
				this.nestLogger.warn(`Failed to log in Loki: ${error.message}`);
				this.handleLokiError(error);
			}

		}
	}

	/**
	 * Log to NestJS (always works)
	 */
	private logToNest(type: LoggerType, id: string, data: any) {
		const message = `${id}: ${JSON.stringify(data)}`;
		
		switch (type) {
			case "Info":
				this.nestLogger.log(message);
				break;
			case "Warn":
				this.nestLogger.warn(message);
				break;
			case "Error":
				this.nestLogger.error(message);
				break;
			default:
				this.nestLogger.log(message);
		}
	}

	/**
	 * Log to Loki (when available)
	 */
	private logToLoki(type: LoggerType, id: string, data: any) {
		if (!this.lokiLogger) return;

		switch (type) {
			case "Info":
				this.lokiLogger.info(id, data);
				break;
			case "Warn":
				this.lokiLogger.warn(id, data);
				break;
			case "Error":
				this.lokiLogger.error(id, data);
				break;
			default:
				this.lokiLogger.info(id, data);
		}
	}

	/**
	 * Try to establish a connection with Loki
	 */
	private async attemptLokiConnection(): Promise<boolean> {
		if (this.lokiStatus === 'connecting') {
			return false;
		}

		this.lokiStatus = 'connecting';
		this.retryConfig.currentAttempt++;

		this.nestLogger.log(`Attempting ${this.retryConfig.currentAttempt} to connect to Loki...`);

		try {

			const healthStatus = await this.lokiService.isHealth();
			if (healthStatus !== "Health") {
				throw new Error('Loki service is not healthy');
			}

			const transport = await this.lokiService.getService<LokiTransport>();
			if (!transport) {
				throw new Error('Failed to get Loki transport');
			}

			this.lokiLogger = createLogger({
				transports: [transport]
			});

			await this.testLokiConnection();

			this.lokiStatus = 'connected';
			this.retryConfig.currentAttempt = 0;
			this.retryConfig.currentDelay = this.retryConfig.initialDelay;

			this.nestLogger.log('Connection with Loki successfully established!');
			
			this.register("Info", "LOKI_CONNECTION", {
				action: "connection_successful",
				attempt: this.retryConfig.currentAttempt,
				timestamp: new Date().toISOString()
			});

			return true;

		} catch (error) {
			this.lokiStatus = 'error';
			this.lokiLogger = null;

			this.nestLogger.warn(`Failed to connect to Loki (attempt ${this.retryConfig.currentAttempt}): ${error.message}`);
			
			return false;
		}
	}

	/**
	 * Test the connection with Loki by making a test log
	 */
	private async testLokiConnection(): Promise<void> {
		if (!this.lokiLogger) {
			throw new Error('Loki logger not available');
		}

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error('Loki connection test timeout'));
			}, 5000);

			try {
				this.lokiLogger!.info('LOKI_TEST', {
					action: 'connection_test',
					timestamp: new Date().toISOString()
				});
				
				clearTimeout(timeout);
				resolve();
			} catch (error) {
				clearTimeout(timeout);
				reject(error);
			}
		});
	}

	/**
	 * Starts retry process in background
	 */
	private startBackgroundRetry() {
		if (!this.shouldRetry) return;

		if (this.lokiStatus === 'connected') {
			this.scheduleHealthCheck();
		} else {

			this.scheduleNextAttempt();
		}
	}

	/**
	 * Schedule periodic health checks
	 */
	private scheduleHealthCheck() {
		if (!this.shouldRetry) return;

		this.retryTimer = setTimeout(async () => {
			try {
				const isHealthy = await this.lokiService.isHealth();
				
				if (isHealthy === "Health") {
					this.scheduleHealthCheck();
				} else {
					this.nestLogger.warn('Connection with Loki lost, returning to retry mode...');
					this.lokiStatus = 'disconnected';
					this.lokiLogger = null;
					this.startBackgroundRetry();
				}
			} catch (error) {
				this.handleLokiError(error);
			}
		}, 30000);
	}

	/**
	 * Schedule next connection attempt
	 */
	private scheduleNextAttempt() {
		if (!this.shouldRetry) return;

		const delay = this.calculateNextDelay();

		this.nestLogger.log(`Next connection attempt with Loki in ${delay/1000}s`);

		this.retryTimer = setTimeout(async () => {
			const success = await this.attemptLokiConnection();
			
			if (success) {
				this.startBackgroundRetry();
			}else {
				this.scheduleNextAttempt();
			}
		}, delay);
	}

	/**
	 * Calculates delay for next attempt (exponential backoff)
	 */
	private calculateNextDelay(): number {
		const delay = Math.min(
			this.retryConfig.currentDelay,
			this.retryConfig.maxDelay
		);

		this.retryConfig.currentDelay = Math.min(
			this.retryConfig.currentDelay * this.retryConfig.backoffMultiplier,
			this.retryConfig.maxDelay
		);

		return delay;
	}

	/**
	 * Handles Loki errors
	 */
	private handleLokiError(error: Error) {
		this.lokiStatus = 'error';
		this.lokiLogger = null;

		this.nestLogger.error(`Loki error: ${error.message}`);
		
		if (this.shouldRetry) {
			setTimeout(() => {
				this.startBackgroundRetry();
			}, 1000);
		}
	}

	/**
	 * Force immediate reconnection attempt
	 */
	async forceReconnect(): Promise<boolean> {
		this.nestLogger.log('Forcing reconnection with Loki...');
		
		if (this.retryTimer) {
			clearTimeout(this.retryTimer);
			this.retryTimer = null;
		}

		this.lokiStatus = 'disconnected';
		this.retryConfig.currentDelay = this.retryConfig.initialDelay;

		const success = await this.attemptLokiConnection();
		
		if (success) {
			this.startBackgroundRetry();
		} else {
			this.scheduleNextAttempt();
		}

		return success;
	}

	/**
	 * Current service status
	 */
	getStatus() {
		return {
			lokiStatus: this.lokiStatus,
			nestLoggerAvailable: true,
			currentAttempt: this.retryConfig.currentAttempt,
			nextRetryIn: this.retryTimer ? 'scheduled' : 'not-scheduled',
			lokiAvailable: this.lokiStatus === 'connected'
		};
	}

	/**
	 * Check if Loki is available
	 */
	isLokiAvailable(): boolean {
		return this.lokiStatus === 'connected' && this.lokiLogger !== null;
	}

	/**
	 * Always returns true because NestJS Logger always works
	 */
	isAvailable(): boolean {
		return true;
	}

	/**
	 * Reboot (interface compatibility)
	 */
	async reinitialize(): Promise<boolean> {
		return await this.forceReconnect();
	}
}