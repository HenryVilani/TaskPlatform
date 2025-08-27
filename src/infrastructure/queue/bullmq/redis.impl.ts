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
	private redisInstance: Redis | null = null; // Cache da instância principal

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
		
		// Inicializa conexão principal na inicialização do módulo
		await this.initializePrimaryConnection();
	}

	async onModuleDestroy() {
		await this.cleanupConnections();
	}

	/**
	 * Inicializa conexão principal que será compartilhada
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
	 * Cleanup de todas as conexões
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
	 * Configuração Redis otimizada para BullMQ
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
	 * Health check simplificado usando conexão principal
	 */
	async isHealth(): Promise<HealthServiceStatus> {
		if (!this.isInitialized) {
			return "UnHealth";
		}

		try {
			// Se não tem conexão principal, tenta criar
			if (!this.redisInstance || this.redisInstance.status !== 'ready') {
				await this.initializePrimaryConnection();
			}

			if (!this.redisInstance || this.redisInstance.status !== 'ready') {
				return "UnHealth";
			}

			// Teste ping simples
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
			
			// Reset conexão em caso de erro
			this.redisInstance = null;
			return "UnHealth";
		}
	}

	/**
	 * Retorna serviço Redis se estiver healthy
	 */
	async getService<T>(): Promise<T | null> {
		const healthStatus = await this.isHealth();
		
		if (healthStatus !== "Health" || !this.redisInstance) {
			return null;
		}

		return this.redisInstance as T;
	}

	/**
	 * CRÍTICO: Método específico para BullMQ que cria NOVA conexão
	 * BullMQ precisa de sua própria conexão para evitar conflitos
	 */
	async getHealthyConnection(): Promise<Redis | null> {
		try {
			const healthStatus = await this.isHealth();
			if (healthStatus !== "Health") {
				return null;
			}

			// Para BullMQ, SEMPRE cria uma nova conexão independente
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
	 * Cria conexão Redis estável para uso geral
	 */
	private async createStableRedisConnection(): Promise<Redis> {
		const config = this.getRedisConfig();
		
		const redis = new Redis({
			host: config.host,
			port: config.port,
			password: config.password,
			db: config.db,
			
			// Configurações para estabilidade
			family: 4,
			connectTimeout: 10000,
			commandTimeout: 5000,
			lazyConnect: false, // Conecta imediatamente
			
			// Configurações de retry conservadoras

			maxRetriesPerRequest: 3,
			
			// Configurações de reconexão para conexão principal
			reconnectOnError(err) {
				const targetError = 'READONLY';
				return err.message.includes(targetError);
			},
			
			// Keep-alive para manter conexão estável
			keepAlive: 30000,
			enableAutoPipelining: true,
		});

		this.setupRedisEventListeners(redis, "MAIN");
		
		// Aguarda conexão estar pronta
		await this.waitForRedisReady(redis);
		
		return redis;
	}

	/**
	 * Cria conexão específica para BullMQ com configurações otimizadas
	 */
	private async createBullMQRedisConnection(): Promise<Redis> {
		const config = this.getRedisConfig();
		
		const redis = new Redis({
			host: config.host,
			port: config.port,
			password: config.password,
			db: config.db,
			
			// Configurações ESPECÍFICAS para BullMQ
			family: 4,
			connectTimeout: 10000,
			commandTimeout: 5000,
			lazyConnect: false,
			
			// CRÍTICO: Configurações para BullMQ
			maxRetriesPerRequest: null, // BullMQ gerencia os retries
			
			// Sem reconexão automática - BullMQ gerencia isso
			reconnectOnError: () => false,
			// Configurações de performance para BullMQ
			enableAutoPipelining: false,
			keepAlive: 0, // BullMQ gerencia keep-alive
		});

		this.setupRedisEventListeners(redis, "BULLMQ");
		
		// Aguarda conexão estar pronta
		await this.waitForRedisReady(redis);
		
		return redis;
	}

	/**
	 * Aguarda Redis ficar ready
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
	 * Configura event listeners padronizados
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
	 * Testa conexão manualmente
	 */
	async testConnection(): Promise<boolean> {
		try {
			const config = this.getRedisConfig();
			console.log('🔍 Testando conexão Redis...', config);

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
			console.log('✅ Conectado!');

			const pingResult = await testRedis.ping();
			console.log('📡 PING:', pingResult);

			await testRedis.set('test:connection', 'ok', 'EX', 10);
			const value = await testRedis.get('test:connection');
			console.log('💾 SET/GET:', value);

			await testRedis.quit();
			console.log('🔌 Desconectado');

			return true;

		} catch (error) {
			console.error('❌ Erro:', error.message);
			return false;
		}
	}

	/**
	 * Reset forçado de todas as conexões
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