import { Injectable, OnModuleInit } from "@nestjs/common";
import { error } from "console";
import Redis from "ioredis";
import { IHealthService, HealthServiceStatus } from "src/application/services/health-service.repository";
import { HealthCheckService } from "src/infrastructure/health/health-check.service";

@Injectable()
export class RedisServiceImpl implements IHealthService, OnModuleInit {
	private redis: Redis;

	constructor(
		private readonly healthCheck: HealthCheckService
	) {}

	async onModuleInit() {

		this.redis = new Redis({
			host: "localhost",
			port: 6379,
			maxRetriesPerRequest: null,
			lazyConnect: true,
		});

		this.redis.on("error", async (err) => {

			this.healthCheck.waitServices();

		});

		// registra no health check
		this.healthCheck.register("redis", this);
	}

	async isHealth(): Promise<HealthServiceStatus> {


		try {

			//await this.redis.connect();
			if (this.redis.status != "close" || this.redis.status  != "close") {
				
				await this.redis.ping();

			}else {
				
				await this.redis.connect();

			}

			return "Health";

		}catch(error) {
			console.log(`[Redis] error: ${error}`)
			
			return "UnHealth";

		}
		
	}

	async getService<T>(): Promise<T | null> {
		return (await this.isHealth()) === "Health"
			? (this.redis as T)
			: null;
	}
}
