import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";
import { ISchedulerRepository } from "src/application/services/scheduler.repository";
import { Task } from "src/domain/task/task.entity";
import Redis from "ioredis"
import { BullMQWorkerService } from "./bullmq.worker";
import { type ITaskRepository } from "src/application/repositories/task.repository";

@Injectable()
export class BullMQTaskScheduler implements ISchedulerRepository, OnModuleInit, OnModuleDestroy{

	private readonly queue: Queue;
	private readonly workerService: BullMQWorkerService;

	constructor(
		@Inject("ITaskRepository") private readonly taskRepository: ITaskRepository
	) {

		const connection = new Redis({
			host: process.env.REDIS_HOST ?? "127.0.0.1",
			port: Number(process.env.REDIS_PORT) ?? 6379,
			maxRetriesPerRequest: null
		});

		this.queue = new Queue("tasks", { connection });

		this.workerService = new BullMQWorkerService();

	}

	async schedule(task: Task): Promise<void> {
		
		if (!task.notifyAt) return;

		const delay = task.notifyAt.diffNow().as('millisecond');

		await this.queue.add("notify-task", task, {
			delay: 100,
			attempts: 5,
			removeOnComplete: 5,
			removeOnFail: false,
			backoff: {
				type: "exponential",
				delay: 1000
			},
		});

		console.log("!schedule")

	}

	async onModuleInit() {
		
		await this.workerService.onModuleInit();

	}

	async onModuleDestroy() {
		
		await this.workerService.onModuleDestroy();

	}

}
