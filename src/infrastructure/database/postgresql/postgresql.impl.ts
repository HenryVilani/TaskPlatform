import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { IBaseService, ServiceStatus } from "src/application/services/base-service.repository";
import { HealthCheckService } from "src/infrastructure/health/health-check.service";
import { DataSource } from "typeorm";

@Injectable()
export class PostgreSQLServiceImpl implements IBaseService, OnModuleInit {

	constructor(
		@Inject("Datasource") private readonly datasource: DataSource,
		private readonly healthCheck: HealthCheckService

	) {}

	onModuleInit() {
		
		this.healthCheck.register("database", this);

	}

	async checkHealth(): Promise<ServiceStatus> {

		try {

			if (!this.datasource.isInitialized) return "UnHealth";

			await this.datasource.query("select 1");

			return "Health";

		}catch (error) {

			return "UnHealth";

		}
		
		
	}

	async waitToConnect(): Promise<ServiceStatus> {
		
		for (let attempt = 1; attempt <= 10; attempt++) {

			try {

				if (!this.datasource.isInitialized) {

					await this.datasource.initialize();

				}

				await this.datasource.query("select 1");
				return "Health";

			}catch (error) {

				await new Promise(res => setTimeout(res, 2000));

			}

		}

		return "UnHealth";

	}

	async getService<T>(): Promise<T | null> {

		return await this.checkHealth() == "Health" ? this.datasource as T : null;

	}

}
