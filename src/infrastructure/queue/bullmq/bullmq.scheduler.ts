import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Job, Queue } from "bullmq";
import { ISchedulerRepository } from "src/application/services/scheduler.repository";
import { Task } from "src/domain/task/task.entity";
import Redis from "ioredis"
import { BullMQWorkerService } from "./bullmq.worker";
import { type ITaskRepository } from "src/application/repositories/task.repository";
import { HttpErrorCounter, QueueJobCounter } from "src/infrastructure/observability/prometheus/prometheus-metrics";
import { RedisServiceImpl } from "./redis.impl";


/**
 * BullMQ-based Task Scheduler for scheduling task notifications.
 * Implements ISchedulerRepository to integrate with domain logic.
 */
@Injectable()
export class BullMQTaskScheduler implements ISchedulerRepository, OnModuleInit, OnModuleDestroy {

	private readonly logger = new Logger(BullMQTaskScheduler.name); // Logger for internal logging
	private queue: Queue<Job> | null = null; // BullMQ queue instance
	private workerService: BullMQWorkerService; // Worker service for processing jobs

	constructor(
		@Inject("ITaskRepository") private readonly taskRepository: ITaskRepository,
		private readonly redisService: RedisServiceImpl
	) {

		// Initialize the worker service
		this.workerService = new BullMQWorkerService(redisService);
		
	}

	/**
	 * Schedule a task notification using BullMQ.
	 * @param task Task entity to schedule
	 */
	async schedule(task: Task): Promise<void> {
		// If the task has no notify date, do nothing
		if (!task.notifyAt) return;

		// Calculate the delay in milliseconds from now until the notify time
		const delay = task.notifyAt.diffNow().as('milliseconds');

		try {

			if (!this.queue) return;
			
			// Add a job to the BullMQ queue
			const job = await this.queue.add("notify-task", task, {
				delay: delay,                  // Delay execution until notifyAt
				attempts: 5,                   // Retry up to 5 times on failure
				removeOnComplete: 5,            // Keep only last 5 completed jobs
				removeOnFail: false,            // Keep failed jobs for debugging
				backoff: { type: "exponential", delay: 1000 } // Exponential backoff for retries
			});

			if (job.id) {
				// Store job ID in task and update repository
				task.setJobId(job.id);
				this.taskRepository.update(task.user, task);

				// Increment Prometheus counter for scheduled queue jobs
				QueueJobCounter.inc();
			}
		} catch (error) {
			this.logger.error(`Failed to schedule task ${task.id}:`, error);
			throw error;
		}
	}

	/**
	 * Remove a scheduled job from the queue.
	 * @param jobId Job identifier
	 */
	async removeSchedule(jobId: string): Promise<void> {
		
		if (!this.queue) return;

		const job = await this.queue.getJob(jobId);
		job?.remove();
	}

	/**
	 * Retrieve a scheduled task from the queue.
	 * @param jobId Job identifier
	 * @returns Task data if found, otherwise null
	 */
	async getSchedule(jobId: string): Promise<Task | null> {
		
		if (!this.queue) return null;

		const job = await this.queue.getJob(jobId);
		return job?.data ?? null;
	}

	/**
	 * Update a scheduled task by removing old job and scheduling a new one.
	 * @param task Task entity to reschedule
	 */
	async updateSchedule(task: Task): Promise<void> {
		if (!task.jobId) return;
		if (!this.queue) return;

		await this.queue.remove(task.jobId); // Remove old job
		this.schedule(task);                 // Schedule updated job
	}

	/**
	 * Lifecycle hook called when module initializes.
	 * Initializes the worker service.
	 */
	async onModuleInit() {

		const redis = await this.redisService.getService<Redis>();
		if (!redis) return;

		if (await this.redisService.isHealth() == "Health") {

			this.queue = new Queue("tasks", { connection: redis });

		}

		await this.workerService.onModuleInit();

	}

	/**
	 * Lifecycle hook called when module is destroyed.
	 * Cleans up the worker service.
	 */
	async onModuleDestroy() {
		await this.workerService.onModuleDestroy();
	}

}
