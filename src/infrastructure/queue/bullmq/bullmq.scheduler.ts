import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";
import { ISchedulerRepository } from "src/application/services/scheduler.repository";
import { Task } from "src/domain/task/task.entity";
import Redis from "ioredis"
import { DateTime } from "luxon";
import { initWorker } from "./bullmq.worker";
import { TaskDTO } from "src/interfaces/http/v1/dtos/task.dto";

@Injectable()
export class BullMQTaskScheduler implements ISchedulerRepository {

	private readonly queue: Queue;
	private static initializedWorker: boolean = false; 

	constructor() {

		const connection = new Redis({
			host: process.env.REDIS_HOST ?? "127.0.0.1",
			port: Number(process.env.REDIS_PORT) ?? 6379,
			maxRetriesPerRequest: null
		});

		this.queue = new Queue("tasks", { connection });

		if (!BullMQTaskScheduler.initializedWorker) {

			initWorker(connection);

			BullMQTaskScheduler.initializedWorker = true;

		}
			
		

	}

	async schedule(task: Task): Promise<void> {
		
		if (!task.notifyAt) return;

		const delay = task.notifyAt.diffNow().as('millisecond');
		await this.queue.add("notify-task", task, {
			delay: 0,
			removeOnComplete: 5,
				removeOnFail: 10
		});

		Logger.log(`[${task.id}] Schedule`);
	}

}
