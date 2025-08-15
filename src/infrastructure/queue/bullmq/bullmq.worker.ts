
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Job, Worker } from "bullmq";
import {Redis} from "ioredis";
import { Task } from "src/domain/task/task.entity";

export const initWorker = (connection: Redis) => {
	



}

@Injectable()
export class BullMQWorkerService implements OnModuleInit, OnModuleDestroy {

	private worker: Worker;

	constructor(
		
	) {}

	onModuleInit() {

		this.init();
		
	}

	async onModuleDestroy() {
		
		if (!this.worker) return;

		await this.worker.close()

	}

	private init() {

		const connection = new Redis({
			host: process.env.REDIS_HOST ?? "127.0.0.1",
			port: Number(process.env.REDIS_PORT) ?? 6379,
			maxRetriesPerRequest: null
		});

		const worker = new Worker("tasks", async (job: Job<Task>) => {

		
		

		}, { connection });


	}

}
