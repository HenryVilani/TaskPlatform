
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Job, Worker } from "bullmq";
import {Redis} from "ioredis";
import { Task } from "src/domain/task/task.entity";
import { WSTaskDTO } from "src/interfaces/ws/v1/dto/notify.dto";


@Injectable()
export class BullMQWorkerService implements OnModuleInit, OnModuleDestroy {

	private worker: Worker;
	private redisConnection: Redis;

	constructor() {}

	async onModuleInit() {

		await this.init();

	}

	async onModuleDestroy() {
		
		if (!this.worker) return;
		await this.worker.close()

	}

	private async init() {

		console.log("[WORKER] INIT")

		this.redisConnection = new Redis({
			host: process.env.REDIS_HOST ?? "127.0.0.1",
			port: Number(process.env.REDIS_PORT) ?? 6379,
			maxRetriesPerRequest: null
		});


		this.worker = new Worker("tasks", async (job: Job<Task>) => {

			console.log("ENTREI NO JOB")

			const task: Task = job.data;
			task.markAsPending();
			

			const wsTask = WSTaskDTO.fromTask(task);

			try {

				await this.redisConnection.publish(`user:${task.user.id}:notifications`, JSON.stringify(wsTask));

			}catch (error) {

				// handle error and update task in db
				console.log("ERROR: ", error)

			}

		

		}, { connection: this.redisConnection });


	}

}
