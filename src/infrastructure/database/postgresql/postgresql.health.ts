import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { IHealthService, HealthServiceStatus } from "src/application/services/health-service.repository";
import { ConnectionManager } from "src/infrastructure/health/connection-manager";
import { HealthCheckService } from "src/infrastructure/health/health-check.service";
import { DataSource, DataSourceOptions } from "typeorm";
import { LokiServiceImpl } from "src/infrastructure/observability/loki/loki.service.impl";
import { ILoggerRepository } from "src/application/services/logger.repository";
import { NestLogServiceImpl } from "src/infrastructure/observability/nestLog/nestlog.service.impl";

/**
 * PostgreSQL health service implementation that manages database connections and health checks.
 * Implements health monitoring for the PostgreSQL database service.
 */
@Injectable()
export class PostgreSQLServiceImpl implements IHealthService, OnModuleInit, OnModuleDestroy {

	/**
	 * Connection name identifier for the database service
	 * @private
	 * @readonly
	 * @type {string}
	 */
	private readonly connectionName = "database";

	private logger: ILoggerRepository | null = null;

	/**
	 * Constructor for PostgreSQL health service.
	 * @param {DataSource} datasource - The TypeORM DataSource instance
	 * @param {HealthCheckService} healthCheck - Health check service for monitoring
	 * @param {ConnectionManager} connectionManager - Connection manager for handling database connections
	 * @param {LokiServiceImpl} logger - Loki logging service
	 */
	constructor(
		@Inject("Datasource") private readonly datasource: DataSource,
		private readonly healthCheck: HealthCheckService,
		private readonly connectionManager: ConnectionManager		

	) {}

	/**
	 * Lifecycle hook called after module initialization.
	 * Registers this service with the health check system.
	 */
	async onModuleInit() {
		this.healthCheck.register(this.connectionName, this);

		this.logger = await this.connectionManager.getConnection<ILoggerRepository>("log", async () => new NestLogServiceImpl())
	}

	/**
	 * Lifecycle hook called before module destruction.
	 * Disconnects database connections gracefully.
	 * @returns {Promise<void>}
	 */
	async onModuleDestroy() {
		this.connectionManager.disconnect(this.connectionName);
	}

	/**
	 * Performs health check on the PostgreSQL database.
	 * @returns {Promise<HealthServiceStatus>} Health status ("Health" or "UnHealth")
	 */
	async isHealth(): Promise<HealthServiceStatus> {
		
		try {
			// Tenta obter conexão existente ou criar nova
			const datasource = await this.connectionManager.getConnection<DataSource>(
				this.connectionName,
				() => this.createDatabaseConnection(),
				{
					connectionTimeout: 5000,
					maxRetries: 2,
					retryDelay: 2000
				}
			);

			if (!datasource) {
				return "UnHealth";
			}


			const isValid = await this.connectionManager.validateConnection<DataSource>(
				this.connectionName,
				async (connection) => {
					if (!connection.isInitialized) {
						await connection.initialize();
					}

					// Test query com timeout
					await Promise.race([
						connection.query("SELECT 1"),
						new Promise<never>((_, reject) => 
							setTimeout(() => reject(new Error('Query timeout')), 3000)
						)
					]);

					return true;
				}
			);

			return isValid ? "Health" : "UnHealth";

		} catch (error) {
			this.logger?.register("Error", "DATABASE_HEALTH_CHECK", {
				service: this.connectionName,
				error: error.message,
				timestamp: new Date().toISOString()
			});

			return "UnHealth";
		}

	}

	/**
	 * Creates a new database connection using the injected DataSource.
	 * @private
	 * @returns {Promise<DataSource>} The initialized DataSource instance
	 * @throws {Error} If connection initialization fails
	 */
	private async createDatabaseConnection(): Promise<DataSource> {
		const datasource = this.datasource

		if (!datasource.isInitialized) {
			try {
				this.logger?.register("Info", "DATABASE_CONNECTION", {
					service: this.connectionName,
					action: "initializing",
					timestamp: new Date().toISOString()
				});

				await datasource.initialize();

				this.logger?.register("Info", "DATABASE_CONNECTION", {
					service: this.connectionName,
					action: "initialized",
					timestamp: new Date().toISOString()
				});

			}catch (error){
				this.logger?.register("Error", "DATABASE_CONNECTION", {
					service: this.connectionName,
					action: "initialization_failed",
					error: error.message,
					timestamp: new Date().toISOString()
				});

				this.healthCheck.scheduleReconnection(this.connectionName);

			}
		}

		return datasource;
	}

	/**
	 * Gets the database service if it's healthy.
	 * @template T
	 * @returns {Promise<T | null>} The database service instance or null if unhealthy
	 */
	async getService<T>(): Promise<T | null> {

		const healthStatus = await this.isHealth();
		
		if (healthStatus !== "Health") {
			return null;
		}

		const datasource = await this.connectionManager.getConnection<DataSource>(
			this.connectionName,
			() => this.createDatabaseConnection()
		);

		return datasource as T;

	}

}