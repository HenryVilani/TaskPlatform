import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { IHealthService, HealthServiceStatus } from "src/application/services/health-service.repository";
import { HealthCheckService } from "src/infrastructure/health/health-check.service";
import LokiTransport from "winston-loki";
import axios from "axios";
import { ConnectionManager } from "src/infrastructure/health/connection-manager";
import { ServiceErrorCounter } from "src/infrastructure/observability/prometheus/prometheus-metrics";

/**
 * Health service implementation for Loki logging system.
 * Manages Loki connections and provides health monitoring for the logging service.
 */
@Injectable()
export class LokiBaseServiceImpl implements IHealthService, OnModuleInit, OnModuleDestroy {

	/**
	 * Connection name identifier for the Loki service
	 * @private
	 * @readonly
	 * @type {string}
	 */
	private readonly connectionName = "log";

	/**
	 * Loki transport instance for Winston logging
	 * @private
	 * @type {LokiTransport | null}
	 */
	private loki: LokiTransport | null = null;

	/**
	 * Constructor for Loki health service.
	 * @param {HealthCheckService} healthCheck - Health check service for monitoring
	 * @param {ConnectionManager} connectionManager - Connection manager for handling Loki connections
	 */
	constructor(
		private readonly healthCheck: HealthCheckService,
		private readonly connectionManager: ConnectionManager
	) {}

	/**
	 * Lifecycle hook called after module initialization.
	 * Registers this service with health check and creates initial Loki connection.
	 * @returns {Promise<void>}
	 */
	async onModuleInit() {

		// Registra no health check
		this.healthCheck.register(this.connectionName, this);

		// Cria a conexão Loki inicial
		await this.getService<LokiTransport>();

	}

	/**
	 * Lifecycle hook called before module destruction.
	 * Disconnects Loki connections gracefully.
	 * @returns {Promise<void>}
	 */
	async onModuleDestroy() {

		await this.connectionManager.disconnect(this.connectionName);

	}

	/**
	 * Health check via endpoint /ready do Loki
	 * @returns {Promise<HealthServiceStatus>} Health status ("Health" or "UnHealth")
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
	 * Gets the Loki service if it's healthy.
	 * @template T
	 * @returns {Promise<T | null>} The Loki service instance or null if unhealthy
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
	 * Gets a healthy Loki connection for use in loggers.
	 * @returns {Promise<LokiTransport | null>} Loki transport instance or null if unhealthy
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
	 * Creates a new LokiTransport instance.
	 * @private
	 * @returns {Promise<LokiTransport>} New Loki transport instance
	 * @throws {Error} If Loki service is unhealthy
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
	 * Forces a reset of the Loki connection.
	 * @returns {Promise<void>}
	 */
	async resetConnection(): Promise<void> {

		await this.connectionManager.disconnect(this.connectionName);
		this.loki = null;

	}

}