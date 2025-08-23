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
 * BullMQ-based Task Scheduler melhorado com health check integration
 * Implements ISchedulerRepository to integrate with domain logic.
 */
@Injectable()
export class BullMQTaskScheduler implements ISchedulerRepository, OnModuleInit, OnModuleDestroy {

	private readonly logger = new Logger(BullMQTaskScheduler.name);
	private queue: Queue<Job> | null = null;
	private workerService: BullMQWorkerService;

	constructor(
		@Inject("ITaskRepository") private readonly taskRepository: ITaskRepository,
		private readonly redisService: RedisServiceImpl
	) {
		this.workerService = new BullMQWorkerService(redisService);
	}

	/**
	 * Schedule a task notification usando BullMQ apenas se Redis estiver healthy
	 */
	async schedule(task: Task): Promise<void> {
		if (!task.notifyAt) return;

		try {
			const queue = await this.getHealthyQueue();
			if (!queue) {
				this.logger.warn(`Cannot schedule task ${task.id} - Redis unhealthy`);
				return;
			}

			const delay = task.notifyAt.diffNow().as('milliseconds');

			const job = await queue.add("notify-task", task, {
				delay: delay,
				attempts: 3, // Reduzido de 5 para 3
				removeOnComplete: 5,
				removeOnFail: false,
				backoff: { type: "exponential", delay: 2000 }
			});

			if (job.id) {
				task.setJobId(job.id);
				await this.taskRepository.update(task.user, task);
				QueueJobCounter.inc();
				this.logger.log(`✅ Task ${task.id} scheduled successfully`);
			}

		} catch (error) {
			this.logger.error(`💥 Failed to schedule task ${task.id}: ${error.message}`);
			// Não throw - deixa aplicação continuar funcionando
		}
	}

	/**
	 * Remove scheduled job apenas se Redis estiver healthy
	 */
	async removeSchedule(jobId: string): Promise<void> {
		try {
			const queue = await this.getHealthyQueue();
			if (!queue) {
				this.logger.warn(`Cannot remove job ${jobId} - Redis unhealthy`);
				return;
			}

			const job = await queue.getJob(jobId);
			if (job) {
				await job.remove();
				this.logger.log(`🗑️ Job ${jobId} removed successfully`);
			}

		} catch (error) {
			this.logger.error(`💥 Failed to remove job ${jobId}: ${error.message}`);
		}
	}

	/**
	 * Get scheduled task apenas se Redis estiver healthy
	 */
	async getSchedule(jobId: string): Promise<Task | null> {
		try {
			const queue = await this.getHealthyQueue();
			if (!queue) return null;

			const job = await queue.getJob(jobId);
			return job?.data ?? null;

		} catch (error) {
			this.logger.error(`💥 Failed to get job ${jobId}: ${error.message}`);
			return null;
		}
	}

	/**
	 * Update scheduled task apenas se Redis estiver healthy
	 */
	async updateSchedule(task: Task): Promise<void> {
		if (!task.jobId) return;

		try {
			// Remove old job
			await this.removeSchedule(task.jobId);
			// Schedule new job
			await this.schedule(task);

		} catch (error) {
			this.logger.error(`💥 Failed to update schedule for task ${task.id}: ${error.message}`);
		}
	}

	/**
	 * Obtém queue apenas se Redis estiver healthy
	 */
	private async getHealthyQueue(): Promise<Queue<Job> | null> {
		// Se já existe queue, verifica se Redis ainda está healthy
		if (this.queue) {
			const isRedisHealthy = await this.redisService.isHealth();
			if (isRedisHealthy === "Health") {
				return this.queue;
			} else {
				// Redis ficou unhealthy, remove queue
				await this.closeQueue();
			}
		}

		// Tenta criar nova queue se Redis estiver healthy
		const redis = await this.redisService.getHealthyConnection();
		if (!redis) {
			return null;
		}

		try {
			this.queue = new Queue("tasks", { 
				connection: redis,
				defaultJobOptions: {
					removeOnComplete: 10,
					removeOnFail: 5,
				}
			});

			// Event listeners para monitoramento
			this.queue.on('error', (error) => {
				this.logger.error(`Queue error: ${error.message}`);
				this.closeQueue(); // Remove queue com erro
			});

			this.logger.log(`🚀 Queue initialized successfully`);
			return this.queue;

		} catch (error) {
			this.logger.error(`💥 Failed to create queue: ${error.message}`);
			return null;
		}
	}

	/**
	 * Fecha queue atual
	 */
	private async closeQueue(): Promise<void> {
		if (this.queue) {
			try {
				await this.queue.close();
				this.logger.log(`🔌 Queue closed`);
			} catch (error) {
				this.logger.error(`Error closing queue: ${error.message}`);
			} finally {
				this.queue = null;
			}
		}
	}

	/**
	 * Module initialization
	 */
	async onModuleInit() {
		this.logger.log(`Initializing BullMQ Scheduler...`);
		
		// Não inicializa queue aqui - será criada on-demand quando Redis estiver healthy
		await this.workerService.onModuleInit();
		
		this.logger.log(`✅ BullMQ Scheduler initialized`);
	}

	/**
	 * Module destruction
	 */
	async onModuleDestroy() {
		this.logger.log(`Shutting down BullMQ Scheduler...`);
		
		await this.closeQueue();
		await this.workerService.onModuleDestroy();
		
		this.logger.log(`✅ BullMQ Scheduler shutdown complete`);
	}

}