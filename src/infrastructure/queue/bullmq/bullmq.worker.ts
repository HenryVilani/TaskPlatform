import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Job, Worker } from "bullmq";
import { Redis } from "ioredis";
import { Task } from "src/domain/task/task.entity";

/**
 * BullMQ Worker Service for processing scheduled tasks.
 * Publishes task notifications to Redis channels.
 */
@Injectable()
export class BullMQWorkerService implements OnModuleInit, OnModuleDestroy {

	private readonly logger = new Logger(BullMQWorkerService.name); // Logger for internal logs
	private worker: Worker; // BullMQ Worker instance
	private redisConnection: Redis; // Redis connection for publishing messages

	constructor() {}

	/**
	 * Lifecycle hook called when module initializes.
	 * Initializes the BullMQ worker.
	 */
	async onModuleInit() {
		await this.init();
	}

	/**
	 * Lifecycle hook called when module is destroyed.
	 * Closes the BullMQ worker gracefully.
	 */
	async onModuleDestroy() {
		if (!this.worker) return;
		await this.worker.close();
	}

	/**
	 * Initialize Redis connection and BullMQ worker.
	 */
	private async init() {
		this.logger.log("Initializing BullMQ Worker");

		// Initialize Redis connection
		this.redisConnection = new Redis({
			host: process.env.REDIS_HOST ?? "127.0.0.1",
			port: Number(process.env.REDIS_PORT) ?? 6379,
			maxRetriesPerRequest: null
		});

		// Test Redis connectivity
		await this.redisConnection.ping();
		this.logger.log("Redis connection established");

		// Initialize BullMQ worker to process "tasks" queue
		this.worker = new Worker("tasks", async (job: Job<Task>) => {
			const task = job.data;

			try {
				// Publish task notification to the Redis channel for the user
				const channel = `user:${task.user.id}:notifications`;
				const message = JSON.stringify(task);
				await this.redisConnection.publish(channel, message);

			} catch (error) {
				// Throw error so BullMQ can retry according to backoff policy
				throw error;
			}
		}, {
			connection: this.redisConnection,
			concurrency: 10, // Maximum number of concurrent jobs
		});

		// Event listeners for debugging and logging
		this.worker.on('completed', (job) => {
			this.logger.log(`Job ${job.id} completed successfully`);
		});

		this.worker.on('failed', (job, err) => {
			this.logger.error(`Job ${job?.id} failed:`, err);
		});

		this.worker.on('error', (err) => {
			this.logger.error('Worker error:', err);
		});

		this.logger.log("BullMQ Worker initialized successfully");
	}
}
