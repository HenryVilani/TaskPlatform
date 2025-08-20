import { Inject, Injectable } from "@nestjs/common";
import { IHealthServiceRepository } from "src/application/services/health.repository";
import { DataSource } from "typeorm";

@Injectable()
class PostgreSQLHealthCheckImpl implements IHealthServiceRepository {

	constructor(
		@Inject("Datasource") private readonly datasource: DataSource
	) {}

	async checkService(): Promise<boolean> {

		try {

			if (!this.datasource.isInitialized) return false;

			await this.datasource.query("select 1");

			return true;

		}catch (error) {

			return false;

		}
		
		
	}

	async waitToConnect(): Promise<boolean> {
		
		for (let attempt = 1; attempt <= 10; attempt++) {

			try {

				if (!this.datasource.isInitialized) {

					await this.datasource.initialize();

				}

				await this.datasource.query("select 1");
				return true;

			}catch (error) {

				await new Promise(res => setTimeout(res, 2000));

			}

		}

		return false;

	}

}
