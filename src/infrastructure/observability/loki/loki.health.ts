import { Injectable, OnModuleInit } from "@nestjs/common";
import { IHealthService, HealthServiceStatus } from "src/application/services/health-service.repository";
import { HealthCheckService } from "src/infrastructure/health/health-check.service";
import LokiTransport from "winston-loki";
import axios from "axios";

@Injectable()
export class LokiBaseServiceImpl implements IHealthService, OnModuleInit {
	
	private loki: LokiTransport | null = null;

	constructor(
		private readonly healthCheck: HealthCheckService
	) {}

	onModuleInit() {

		this.loki = new LokiTransport({
			host: process.env.LOKI_URL ?? "http://localhost:3100",
			labels: { service: "my-service" },
			json: true,
			batching: false,
		});

		this.healthCheck.register("log", this);

	}

	async isHealth(): Promise<HealthServiceStatus> {
		
		const url = (process.env.LOKI_URL ?? "http://localhost:3100") + "/ready";

		try {
			
			await axios.get(url, { timeout: 2000 });
			return "Health";

		}catch {
			
			return "UnHealth";

		}
		
	}

	async getService<T>(): Promise<T | null> {

		return (await this.isHealth()) === "Health"
			? (this.loki as T)
			: null;

	}

}
