import { Injectable, OnModuleInit } from "@nestjs/common";
import { IBaseService, ServiceStatus } from "src/application/services/base-service.repository";
import { HealthCheckService } from "src/infrastructure/health/health-check.service";
import LokiTransport from "winston-loki";
import axios from "axios";

@Injectable()
export class LokiBaseServiceImpl implements IBaseService, OnModuleInit {
	private loki: LokiTransport | null = null;

	constructor(
		private readonly healthCheck: HealthCheckService
	) { }

	onModuleInit() {
		// cria transport Loki
		this.loki = new LokiTransport({
			host: process.env.LOKI_URL ?? "http://localhost:3100",
			labels: { service: "my-service" },
			json: true,
			batching: false,
		});

		// registra no health check
		this.healthCheck.register("loki", this);
	}

	async checkHealth(): Promise<ServiceStatus> {
		const url = (process.env.LOKI_URL ?? "http://localhost:3100") + "/ready";

		try {
			await axios.get(url, { timeout: 2000 });
			return "Health";
		} catch (err) {
			return "UnHealth";
		}
	}

	async waitToConnect(): Promise<ServiceStatus> {
		const url = (process.env.LOKI_URL ?? "http://localhost:3100") + "/ready";

		for (let attempt = 1; attempt <= 10; attempt++) {
			try {
				await axios.get(url, { timeout: 2000 });
				return "Health";
			} catch {
				console.log(`[Loki] Tentativa ${attempt} falhou, tentando novamente...`);
				await new Promise(res => setTimeout(res, 2000));
			}
		}

		return "UnHealth";
	}

	async getService<T>(): Promise<T | null> {
		return (await this.checkHealth()) === "Health"
			? (this.loki as T)
			: null;
	}
}
