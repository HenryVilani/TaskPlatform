import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Job, Queue } from "bullmq";
import { ISchedulerRepository } from "src/application/services/scheduler.repository";
import { Task } from "src/domain/task/task.entity";
import Redis from "ioredis"
import { BullMQWorkerService } from "./bullmq.worker";
import { type ITaskRepository } from "src/application/repositories/task.repository";
import { HttpErrorCounter, QueueJobCounter } from "src/infrastructure/observability/prometheus/prometheus-metrics";
import { RedisServiceImpl } from "./redis.impl";
import { LokiServiceImpl } from "src/infrastructure/observability/loki/loki.service.impl";


/**
 * BullMQ-based Task Scheduler melhorado com health check integration
 * Implements ISchedulerRepository to integrate with domain logic.
 */
@Injectable()
export class BullMQTaskScheduler implements ISchedulerRepository, OnModuleInit, OnModuleDestroy {

	private queue: Queue<Job> | null = null;
	private workerService: BullMQWorkerService;

	constructor(
		@Inject("ITaskRepository") private readonly taskRepository: ITaskRepository,
		private readonly redisService: RedisServiceImpl,
		private readonly logger: LokiServiceImpl
	) {
		this.workerService = new BullMQWorkerService(redisService, logger);
		
	}

	/**
	 * Schedule a task notification usando BullMQ apenas se Redis estiver healthy
	 */
	async schedule(task: Task): Promise<void> {
		if (!task.notifyAt) return;

		try {
			const queue = await this.getHealthyQueue();
			if (!queue) {
				this.logger.register("Warn", "BULLMQ_SCHEDULER", {
					action: "schedule_failed",
					taskId: task.id,
					reason: "redis_unhealthy",
					timestamp: new Date().toISOString()
				});
				return;
			}

			const delay = task.notifyAt.diffNow().as('milliseconds');

			const job = await queue.add("notify-task", task, {
				delay: delay,
				attempts: 3,
				removeOnComplete: 5,
				removeOnFail: false,
				backoff: { type: "exponential", delay: 2000 }
			});

			if (job.id) {
				task.setJobId(job.id);
				await this.taskRepository.update(task.user, task);
				QueueJobCounter.inc();
				
				this.logger.register("Info", "BULLMQ_SCHEDULER", {
					action: "task_scheduled",
					taskId: task.id,
					jobId: job.id,
					delay,
					timestamp: new Date().toISOString()
				});
			}

		} catch (error) {
			this.logger.register("Error", "BULLMQ_SCHEDULER", {
				action: "schedule_failed",
				taskId: task.id,
				error: error.message,
				timestamp: new Date().toISOString()
			});
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
				this.logger.register("Warn", "BULLMQ_SCHEDULER", {
					action: "remove_schedule_failed",
					jobId,
					reason: "redis_unhealthy",
					timestamp: new Date().toISOString()
				});
				return;
			}

			const job = await queue.getJob(jobId);
			if (job) {
				await job.remove();
				this.logger.register("Info", "BULLMQ_SCHEDULER", {
					action: "job_removed",
					jobId,
					timestamp: new Date().toISOString()
				});
			}

		} catch (error) {
			this.logger.register("Error", "BULLMQ_SCHEDULER", {
				action: "remove_schedule_failed",
				jobId,
				error: error.message,
				timestamp: new Date().toISOString()
			});
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
			this.logger.register("Error", "BULLMQ_SCHEDULER", {
				action: "get_schedule_failed",
				jobId,
				error: error.message,
				timestamp: new Date().toISOString()
			});
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
			this.logger.register("Error", "BULLMQ_SCHEDULER", {
				action: "update_schedule_failed",
				taskId: task.id,
				error: error.message,
				timestamp: new Date().toISOString()
			});
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
				this.logger.register("Error", "BULLMQ_SCHEDULER", {
					action: "queue_error",
					error: error.message,
					timestamp: new Date().toISOString()
				});
				this.closeQueue(); // Remove queue com erro
			});

			this.logger.register("Info", "BULLMQ_SCHEDULER", {
				action: "queue_initialized",
				timestamp: new Date().toISOString()
			});
			return this.queue;

		} catch (error) {
			this.logger.register("Error", "BULLMQ_SCHEDULER", {
				action: "queue_creation_failed",
				error: error.message,
				timestamp: new Date().toISOString()
			});
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
				this.logger.register("Info", "BULLMQ_SCHEDULER", {
					action: "queue_closed",
					timestamp: new Date().toISOString()
				});
			} catch (error) {
				this.logger.register("Error", "BULLMQ_SCHEDULER", {
					action: "queue_close_error",
					error: error.message,
					timestamp: new Date().toISOString()
				});
			} finally {
				this.queue = null;
			}
		}
	}

	/**
	 * Module initialization
	 */
	async onModuleInit() {
		this.logger.register("Info", "BULLMQ_SCHEDULER", {
			action: "initializing",
			timestamp: new Date().toISOString()
		});
		
		// Não inicializa queue aqui - será criada on-demand quando Redis estiver healthy
		await this.workerService.onModuleInit();
		
		this.logger.register("Info", "BULLMQ_SCHEDULER", {
			action: "initialized",
			timestamp: new Date().toISOString()
		});
	}

	/**
	 * Module destruction
	 */
	async onModuleDestroy() {
		this.logger.register("Info", "BULLMQ_SCHEDULER", {
			action: "shutting_down",
			timestamp: new Date().toISOString()
		});
		
		await this.closeQueue();
		await this.workerService.onModuleDestroy();
		
		this.logger.register("Info", "BULLMQ_SCHEDULER", {
			action: "shutdown_complete",
			timestamp: new Date().toISOString()
		});
	}

}