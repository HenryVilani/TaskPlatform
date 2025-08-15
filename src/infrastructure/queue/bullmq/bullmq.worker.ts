
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Job, Worker } from "bullmq";
import {Redis} from "ioredis";
import { Emitter } from '@socket.io/redis-emitter';
import { Task } from "src/domain/task/task.entity";



export class BullMQWorkerService implements OnModuleInit, OnModuleDestroy {

	private worker: Worker;
	private ioEmitte: Emitter;

	constructor() {}

	async onModuleInit() {

		console.log("CALLL")
		await this.init();

	}

	async onModuleDestroy() {
		
		if (!this.worker) return;

		await this.worker.close()

	}

	private async init() {

		console.log("[WORKER] INIT")

		const connection = new Redis({
			host: process.env.REDIS_HOST ?? "127.0.0.1",
			port: Number(process.env.REDIS_PORT) ?? 6379,
			maxRetriesPerRequest: null
		});

		this.ioEmitte = new Emitter(connection);

		this.worker = new Worker("tasks", async (job: Job<Task>) => {

			const task: Task = job.data;

			console.log(task)
			console.log(`[JOB] ${task.user.id}`);

			this.ioEmitte.to(`user:${task.user.id}`).emit("task:notify", {value: "123"})
		

		}, { connection });

		this.worker.on('completed', (job) => console.log('[OK]', job.id));
		this.worker.on('failed', (job, err) => console.error('[FAIL]', job?.id, err));

	}

}
