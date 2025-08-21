import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { IHealthService, HealthServiceStatus } from "src/application/services/health-service.repository";
import { HealthCheckService } from "src/infrastructure/health/health-check.service";
import { DataSource } from "typeorm";

@Injectable()
export class PostgreSQLServiceImpl implements IHealthService, OnModuleInit {

	constructor(
		@Inject("Datasource") private readonly datasource: DataSource,
		private readonly healthCheck: HealthCheckService

	) {}

	onModuleInit() {
		
		this.healthCheck.register("database", this);

	}


	async isHealth(): Promise<HealthServiceStatus> {
		
		try {

			if (!this.datasource.isInitialized) await this.datasource.initialize();

			await this.datasource.query("select 1");
				return "Health";

		}catch {

			return "UnHealth";

		}

	}

	async getService<T>(): Promise<T | null> {

		return await this.isHealth() == "Health" ? this.datasource as T : null;

	}

}
