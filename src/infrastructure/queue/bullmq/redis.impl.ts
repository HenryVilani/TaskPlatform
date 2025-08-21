import { Injectable, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { IBaseService, ServiceStatus } from "src/application/services/base-service.repository";
import { HealthCheckService } from "src/infrastructure/health/health-check.service";

@Injectable()
export class RedisServiceImpl implements IBaseService, OnModuleInit {
	private redis: Redis | null = null;

	constructor(
		private readonly healthCheck: HealthCheckService
	) { }

	onModuleInit() {
		// Cria o cliente uma vez só
		this.redis = new Redis({
			host: process.env.REDIS_HOST ?? "redis",
			port: Number(process.env.REDIS_PORT) ?? 6379,
			maxRetriesPerRequest: null,
			retryStrategy: (times) => {
				if (times > 10) return null; // desiste após 10 tentativas
				return 2000; // tenta a cada 2s
			}
		});

		// Tratar eventos para evitar Unhandled error
		this.redis.on("connect", () => {});

		this.redis.on("error", (err) => {});

		this.redis.on("close", () => {});

		// registra no health check
		this.healthCheck.register("redis", this);
	}

	async checkHealth(): Promise<ServiceStatus> {
		if (!this.redis) return "UnHealth";
		try {
			await this.redis.ping();
			return "Health";
		} catch {
			return "UnHealth";
		}
	}

	async waitToConnect(): Promise<ServiceStatus> {
		if (!this.redis) return "UnHealth";

		for (let attempt = 1; attempt <= 10; attempt++) {
			try {
				await this.redis.ping();
				return "Health";
			} catch {
				console.log(`[Redis] Tentativa ${attempt} falhou, tentando novamente...`);
				await new Promise(res => setTimeout(res, 2000));
			}
		}

		return "UnHealth";
	}

	async getService<T>(): Promise<T | null> {
		return (await this.checkHealth()) === "Health"
			? (this.redis as T)
			: null;
	}
}
