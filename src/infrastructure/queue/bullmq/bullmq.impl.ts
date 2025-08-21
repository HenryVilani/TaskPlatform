import { Injectable, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { IBaseService, ServiceStatus } from "src/application/services/base-service.repository";
import { HealthCheckService } from "src/infrastructure/health/health-check.service";
import { RedisServiceImpl } from "./redis.impl";

@Injectable()
export class BullMQServiceImpl implements IBaseService, OnModuleInit {

	private redis: Redis | null;

	constructor(		
		private readonly healthCheck: HealthCheckService,
		private readonly redisService: RedisServiceImpl

	) {}

	async onModuleInit() {
		
		this.healthCheck.register("bullmq", this);

		this.redis = await this.redisService.getService<Redis>();

	}

	async checkHealth(): Promise<ServiceStatus> {

		this.redis = await this.redisService.getService<Redis>();

		try {

			if (!this.redis) return "UnHealth";

			await this.redis.ping()
			return "Health";

		}catch (error) {

			return "UnHealth";

		}
		
		
	}

	async waitToConnect(): Promise<ServiceStatus> {
		
		for (let attempt = 1; attempt <= 10; attempt++) {

			try {

				if (!this.redis) return "UnHealth";

				try {
					
					await this.redis.ping()

				}catch {

					await this.redis.connect()
					return "Health";

				}		

			}catch (error) {

				await new Promise(res => setTimeout(res, 2000));

			}

		}

		return "UnHealth";

	}

	async getService<T>(): Promise<T | null> {

		return await this.checkHealth() == "Health" ? this.redis as T : null;

	}

}
