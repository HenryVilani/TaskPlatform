import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { IHealthService, HealthServiceStatus } from "src/application/services/health-service.repository";
import { HealthCheckService } from "src/infrastructure/health/health-check.service";
import { ConnectionManager } from "src/infrastructure/health/connection-manager";
import { ServiceErrorCounter } from "src/infrastructure/observability/prometheus/prometheus-metrics";

@Injectable()
export class RedisServiceImpl implements IHealthService, OnModuleInit, OnModuleDestroy {
	private readonly connectionName = "redis";

	constructor(
		private readonly healthCheck: HealthCheckService,
		private readonly connectionManager: ConnectionManager
	) {}

	async onModuleInit() {
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
			return null;
		}
	}

	/**
	 * Factory para criar nova conexão Redis
	 */
	private async createRedisConnection(): Promise<Redis> {
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
			
		});

		redis.on("connect", () => {
		});

		redis.on("close", () => {

			this.connectionManager.disconnect(this.connectionName);

		});

		redis.on("end", () => {
		});

		// Força conexão inicial com timeout
		await Promise.race([
			redis.connect(),
			new Promise<never>((_, reject) => 
				setTimeout(() => reject(new Error('Initial connection timeout')), 3000)
			)
		]);
		
		return redis;
	}

	/**
	 * Método para forçar reset da conexão
	 */
	async resetConnection(): Promise<void> {
		await this.connectionManager.disconnect(this.connectionName);
	}
}