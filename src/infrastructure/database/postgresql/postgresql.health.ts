import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { IHealthService, HealthServiceStatus } from "src/application/services/health-service.repository";
import { ConnectionManager } from "src/infrastructure/health/connection-manager";
import { HealthCheckService } from "src/infrastructure/health/health-check.service";
import { DataSource, DataSourceOptions } from "typeorm";
import { PostgreSQLConfig } from "./postgre.datasource";
import { ServiceErrorCounter } from "src/infrastructure/observability/prometheus/prometheus-metrics";

@Injectable()
export class PostgreSQLServiceImpl implements IHealthService, OnModuleInit, OnModuleDestroy {

	private readonly connectionName = "database";

	constructor(
		@Inject("Datasource") private readonly datasource: DataSource,
		private readonly healthCheck: HealthCheckService,
		private readonly connectionManager: ConnectionManager

	) {}

	onModuleInit() {
		
		this.healthCheck.register(this.connectionName, this);

	}

	async onModuleDestroy() {
		this.connectionManager.disconnect(this.connectionName);
	}

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

			return "UnHealth";
		}

	}

	private async createDatabaseConnection(): Promise<DataSource> {
		const datasource = this.datasource

		if (!datasource.isInitialized) {
			try {

				await datasource.initialize();

			}catch (error){

				this.healthCheck.scheduleReconnection(this.connectionName);

			}
		}

		return datasource;
	}

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
