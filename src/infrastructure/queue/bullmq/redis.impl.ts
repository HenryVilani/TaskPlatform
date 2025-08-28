import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { IHealthService, HealthServiceStatus } from "src/application/services/health-service.repository";
import { HealthCheckService } from "src/infrastructure/health/health-check.service";
import { ConnectionManager } from "src/infrastructure/health/connection-manager";
import { ILoggerRepository } from "src/application/services/logger.repository";
import { NestLogServiceImpl } from "src/infrastructure/observability/nestLog/nestlog.service.impl";

@Injectable()
export class RedisServiceImpl implements IHealthService, OnModuleInit, OnModuleDestroy {
	private readonly connectionName = "redis";
	private logger: ILoggerRepository | null = null;
	private isInitialized = false;
	private redisInstance: Redis | null = null;

	constructor(
		private readonly healthCheck: HealthCheckService,
		private readonly connectionManager: ConnectionManager
	) {}

	async onModuleInit() {
		this.logger = await this.connectionManager.getConnection<ILoggerRepository>(
			"log", 
			async () => new NestLogServiceImpl()
		);

		this.healthCheck.register(this.connectionName, this);
		this.isInitialized = true;

		this.logRedisConfiguration();

		await this.initializePrimaryConnection();
	}

	async onModuleDestroy() {
		await this.cleanupConnections();
	}

	/**
	 * Initializes the primary Redis connection
	 */
	private async initializePrimaryConnection(): Promise<void> {
		try {
			this.logger?.register("Info", "REDIS_SERVICE", {
				action: "initializing_primary_connection",
				timestamp: new Date().toISOString()
			});

			this.redisInstance = await this.createStableRedisConnection();
			
			this.logger?.register("Info", "REDIS_SERVICE", {
				action: "primary_connection_initialized",
				status: this.redisInstance.status,
				timestamp: new Date().toISOString()
			});

		} catch (error) {
			this.logger?.register("Error", "REDIS_SERVICE", {
				action: "primary_connection_failed",
				error: error.message,
				timestamp: new Date().toISOString()
			});
		}
	}

	/**
	 * Cleans up all Redis connections
	 */
	private async cleanupConnections(): Promise<void> {
		if (this.redisInstance) {
			try {
				await this.redisInstance.quit();
				this.redisInstance = null;
			} catch (error) {
				this.logger?.register("Error", "REDIS_SERVICE", {
					action: "cleanup_primary_connection_error",
					error: error.message,
					timestamp: new Date().toISOString()
				});
			}
		}
		
		await this.connectionManager.disconnect(this.connectionName);
	}

	/**
	 * Logs current Redis configuration
	 */
	private logRedisConfiguration(): void {
		const config = this.getRedisConfig();
		this.logger?.register("Info", "REDIS_CONFIG", {
			host: config.host,
			port: config.port,
			hasPassword: !!config.password,
			db: config.db,
			timestamp: new Date().toISOString()
		});
	}

	/**
	 * Gets Redis configuration from environment variables
	 */
	private getRedisConfig() {
		return {
			host: process.env.REDIS_HOST ?? "127.0.0.1",
			port: Number(process.env.REDIS_PORT) || 6379,
			password: process.env.REDIS_PASSWORD,
			db: Number(process.env.REDIS_DB) || 0,
		};
	}

	/**
	 * Checks if Redis service is healthy
	 */
	async isHealth(): Promise<HealthServiceStatus> {
		if (!this.isInitialized) {
			return "UnHealth";
		}

		try {

			if (!this.redisInstance || this.redisInstance.status !== 'ready') {
				await this.initializePrimaryConnection();
			}

			if (!this.redisInstance || this.redisInstance.status !== 'ready') {
				return "UnHealth";
			}

			// Simple ping test
			const result = await Promise.race([
				this.redisInstance.ping(),
				new Promise<never>((_, reject) => 
					setTimeout(() => reject(new Error('Ping timeout')), 2000)
				)
			]);

			return result === 'PONG' ? "Health" : "UnHealth";

		} catch (error) {
			this.logger?.register("Error", "REDIS_SERVICE", {
				action: "health_check_error",
				error: error.message,
				timestamp: new Date().toISOString()
			});
			
			this.redisInstance = null;
			return "UnHealth";
		}
	}

	/**
	 * Gets Redis service instance if healthy
	 */
	async getService<T>(): Promise<T | null> {
		const healthStatus = await this.isHealth();
		
		if (healthStatus !== "Health" || !this.redisInstance) {
			return null;
		}

		return this.redisInstance as T;
	}

	/**
	 * Gets a healthy Redis connection for external usage
	 */
	async getHealthyConnection(): Promise<Redis | null> {
		try {
			const healthStatus = await this.isHealth();
			if (healthStatus !== "Health") {
				return null;
			}

			this.logger?.register("Info", "REDIS_SERVICE", {
				action: "creating_bullmq_connection",
				timestamp: new Date().toISOString()
			});

			return await this.createBullMQRedisConnection();

		} catch (error) {
			this.logger?.register("Error", "REDIS_SERVICE", {
				action: "bullmq_connection_error",
				error: error.message,
				timestamp: new Date().toISOString()
			});
			return null;
		}
	}

	/**
	 * Creates a stable Redis connection for general usage
	 */
	private async createStableRedisConnection(): Promise<Redis> {
		const config = this.getRedisConfig();
		
		const redis = new Redis({
			host: config.host,
			port: config.port,
			password: config.password,
			db: config.db,
			
			family: 4,
			connectTimeout: 10000,
			commandTimeout: 5000,
			lazyConnect: false,

			maxRetriesPerRequest: 3,
			
			reconnectOnError(err) {
				const targetError = 'READONLY';
				return err.message.includes(targetError);
			},
			
			keepAlive: 30000,
			enableAutoPipelining: true,
		});

		this.setupRedisEventListeners(redis, "MAIN");
		
		await this.waitForRedisReady(redis);
		
		return redis;
	}

	/**
	 * Creates a Redis connection optimized for BullMQ usage
	 */
	private async createBullMQRedisConnection(): Promise<Redis> {
		const config = this.getRedisConfig();
		
		const redis = new Redis({
			host: config.host,
			port: config.port,
			password: config.password,
			db: config.db,
			
			family: 4,
			connectTimeout: 10000,
			commandTimeout: 5000,
			lazyConnect: false,
			
			maxRetriesPerRequest: null,
			
			reconnectOnError: () => false,

			enableAutoPipelining: false,
			keepAlive: 0,
		});

		this.setupRedisEventListeners(redis, "BULLMQ");

		await this.waitForRedisReady(redis);
		
		return redis;
	}

	/**
	 * Waits for Redis connection to be ready
	 */
	private async waitForRedisReady(redis: Redis): Promise<void> {
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error('Redis ready timeout'));
			}, 15000);

			if (redis.status === 'ready') {
				clearTimeout(timeout);
				resolve();
				return;
			}

			redis.once('ready', () => {
				clearTimeout(timeout);
				resolve();
			});

			redis.once('error', (error) => {
				clearTimeout(timeout);
				reject(error);
			});
		});
	}

	/**
	 * Sets up event listeners for Redis connection monitoring
	 */
	private setupRedisEventListeners(redis: Redis, type: string): void {
		redis.on("error", (err) => {
			this.logger?.register("Error", "REDIS_SERVICE", {
				action: "connection_error",
				type,
				error: err.message,
				timestamp: new Date().toISOString()
			});
		});

		redis.on("connect", () => {
			this.logger?.register("Info", "REDIS_SERVICE", {
				action: "connected",
				type,
				status: redis.status,
				timestamp: new Date().toISOString()
			});
		});

		redis.on("ready", () => {
			this.logger?.register("Info", "REDIS_SERVICE", {
				action: "ready",
				type,
				status: redis.status,
				timestamp: new Date().toISOString()
			});
		});

		redis.on("close", () => {
			this.logger?.register("Warn", "REDIS_SERVICE", {
				action: "connection_closed",
				type,
				timestamp: new Date().toISOString()
			});
		});

		redis.on("end", () => {
			this.logger?.register("Warn", "REDIS_SERVICE", {
				action: "connection_ended",
				type,
				timestamp: new Date().toISOString()
			});
		});

		redis.on("reconnecting", (delay) => {
			this.logger?.register("Info", "REDIS_SERVICE", {
				action: "reconnecting",
				type,
				delay,
				timestamp: new Date().toISOString()
			});
		});
	}

	/**
	 * Tests Redis connection with basic operations
	 */
	async testConnection(): Promise<boolean> {
		try {
			const config = this.getRedisConfig();
			console.log('🔍 Testing Redis connection...', config);

			const testRedis = new Redis({
				host: config.host,
				port: config.port,
				password: config.password,
				family: 4,
				connectTimeout: 5000,
				commandTimeout: 3000,
				lazyConnect: true,
				maxRetriesPerRequest: 1,
			});

			await testRedis.connect();
			console.log('Connected!');

			const pingResult = await testRedis.ping();
			console.log('PING:', pingResult);

			await testRedis.set('test:connection', 'ok', 'EX', 10);
			const value = await testRedis.get('test:connection');
			console.log('SET/GET:', value);

			await testRedis.quit();
			console.log('Disconnected');

			return true;

		} catch (error) {
			console.error('Error:', error.message);
			return false;
		}
	}

	/**
	 * Resets all Redis connections
	 */
	async resetConnection(): Promise<void> {
		this.logger?.register("Info", "REDIS_SERVICE", {
			action: "resetting_all_connections",
			timestamp: new Date().toISOString()
		});

		await this.cleanupConnections();
		await new Promise(resolve => setTimeout(resolve, 1000));
		await this.initializePrimaryConnection();
	}
}