import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { IHealthService, HealthServiceStatus } from "src/application/services/health-service.repository";
import { HealthCheckService } from "src/infrastructure/health/health-check.service";
import LokiTransport from "winston-loki";
import axios from "axios";
import { ConnectionManager } from "src/infrastructure/health/connection-manager";
import { ServiceErrorCounter } from "src/infrastructure/observability/prometheus/prometheus-metrics";

@Injectable()
export class LokiBaseServiceImpl implements IHealthService, OnModuleInit, OnModuleDestroy {

	private readonly connectionName = "log";

	private loki: LokiTransport | null = null;

	constructor(
		private readonly healthCheck: HealthCheckService,
		private readonly connectionManager: ConnectionManager
	) {}

	async onModuleInit() {

		// Registra no health check
		this.healthCheck.register(this.connectionName, this);

		// Cria a conexão Loki inicial
		await this.getService<LokiTransport>();

	}

	async onModuleDestroy() {

		await this.connectionManager.disconnect(this.connectionName);

	}

	/**
	 * Health check via endpoint /ready do Loki
	 */
	async isHealth(): Promise<HealthServiceStatus> {
		const url = (process.env.LOKI_URL ?? "http://localhost:3100") + "/ready";

		try {
			await axios.get(url, { timeout: 2000 });
			return "Health";
		} catch (error) {
			return "UnHealth";
		}
	}

	/**
	 * Retorna a instância Loki se estiver healthy
	 */
	async getService<T>(): Promise<T | null> {

		const healthStatus = await this.isHealth();

		if (healthStatus !== "Health") {
			return null;
		}

		// Obtém conexão existente ou cria nova via connectionManager
		const loki = await this.connectionManager.getConnection<LokiTransport>(
			this.connectionName,
			() => this.createLokiConnection(),
			{
				connectionTimeout: 3000,
				maxRetries: 2,
				retryDelay: 1000
			}
		);

		return loki as T;
	}

	/**
	 * Retorna Loki somente se estiver healthy (para uso em loggers)
	 */
	async getHealthyConnection(): Promise<LokiTransport | null> {

		try {

			const healthStatus = await this.isHealth();

			if (healthStatus !== "Health") {

				return null;

			}

			return await this.getService<LokiTransport>();

		} catch (error) {

			return null;
			
		}
	}

	/**
	 * Cria nova instância de LokiTransport
	 */
	private async createLokiConnection(): Promise<LokiTransport> {

		const loki = new LokiTransport({
			host: process.env.LOKI_URL ?? "http://localhost:3100",
			labels: { service: process.env.SERVICE_NAME ?? "my-service" },
			json: true,
			batching: false
		});

		loki.on('error', (err) => {

		});

		const health = await this.isHealth();

		if (health !== "Health") {

			throw new Error("Cannot create Loki connection - service unhealthy");

		}

		return loki;
	}

	/**
	 * Força reset da conexão Loki
	 */
	async resetConnection(): Promise<void> {

		await this.connectionManager.disconnect(this.connectionName);
		this.loki = null;

	}

}
