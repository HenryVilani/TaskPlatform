import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Job, Worker } from "bullmq";
import { Task } from "src/domain/task/task.entity";
import { RedisServiceImpl } from "./redis.impl";
import { LokiServiceImpl } from "src/infrastructure/observability/loki/loki.service.impl";

/**
 * BullMQ Worker Service melhorado com health check integration
 * Publishes task notifications to Redis channels apenas se Redis estiver healthy
 */
@Injectable()
export class BullMQWorkerService implements OnModuleInit, OnModuleDestroy {

	private worker: Worker | null = null;

	constructor(
		private readonly redisService: RedisServiceImpl,
		private readonly logger: LokiServiceImpl
	) {}

	/**
	 * Lifecycle hook - inicializa worker apenas se Redis estiver healthy
	 */
	async onModuleInit() {
		this.logger.register("Info", "BULLMQ_WORKER", {
			action: "initializing",
			timestamp: new Date().toISOString()
		});
		await this.initializeWorker();
	}

	/**
	 * Lifecycle hook - cleanup do worker
	 */
	async onModuleDestroy() {
		await this.closeWorker();
	}

	/**
	 * Inicializa worker apenas se Redis estiver healthy
	 */
	private async initializeWorker() {
		try {
			const redis = await this.redisService.getHealthyConnection();
			if (!redis) {
				this.logger.register("Warn", "BULLMQ_WORKER", {
					action: "initialization_skipped",
					reason: "redis_unhealthy",
					timestamp: new Date().toISOString()
				});
				return;
			}

			// Cria worker com configurações otimizadas
			this.worker = new Worker("tasks", async (job: Job<Task>) => {
				await this.processTaskNotification(job);
			}, {
				connection: redis,
				concurrency: 5,
				stalledInterval: 30000,
				maxStalledCount: 1,
			});

			this.worker.on('error', (err) => {
				this.logger.register("Error", "BULLMQ_WORKER", {
					action: "worker_error",
					error: err.message,
					timestamp: new Date().toISOString()
				});
				this.closeWorker();
			});

			this.worker.on('ready', () => {
				this.logger.register("Info", "BULLMQ_WORKER", {
					action: "worker_ready",
					timestamp: new Date().toISOString()
				});
			});

			this.worker.on('failed', (job, err) => {
				this.logger.register("Error", "BULLMQ_WORKER", {
					action: "job_failed",
					jobId: job?.id,
					error: err.message,
					timestamp: new Date().toISOString()
				});
			});

			this.worker.on('completed', (job) => {
				this.logger.register("Info", "BULLMQ_WORKER", {
					action: "job_completed",
					jobId: job.id,
					timestamp: new Date().toISOString()
				});
			});

		} catch (error) {
			this.logger.register("Error", "BULLMQ_WORKER", {
				action: "initialization_failed",
				error: error.message,
				timestamp: new Date().toISOString()
			});
			this.worker = null;
		}
	}

	/**
	 * Processa notificação de task com verificação de health
	 */
	private async processTaskNotification(job: Job<Task>): Promise<void> {
		const task = job.data;

		try {
			// Verifica se Redis ainda está healthy antes de publicar
			const redis = await this.redisService.getHealthyConnection();
			if (!redis) {
				throw new Error('Redis connection unavailable');
			}

			// Publica notificação no canal do usuário
			const channel = `user:${task.user.id}:notifications`;
			const message = JSON.stringify(task);

			await Promise.race([
				redis.publish(channel, message),
				new Promise<never>((_, reject) => 
					setTimeout(() => reject(new Error('Publish timeout')), 5000)
				)
			]);

			this.logger.register("Info", "BULLMQ_WORKER", {
				action: "notification_sent",
				taskId: task.id,
				userId: task.user.id,
				channel,
				timestamp: new Date().toISOString()
			});

		} catch (error) {
			this.logger.register("Error", "BULLMQ_WORKER", {
				action: "notification_failed",
				taskId: task.id,
				error: error.message,
				timestamp: new Date().toISOString()
			});
			
			// Re-throw para BullMQ fazer retry
			throw error;
		}
	}

	/**
	 * Fecha worker atual
	 */
	private async closeWorker(): Promise<void> {
		if (this.worker) {
			try {
				await this.worker.close();
				this.logger.register("Info", "BULLMQ_WORKER", {
					action: "worker_closed",
					timestamp: new Date().toISOString()
				});
			} catch (error) {
				this.logger.register("Error", "BULLMQ_WORKER", {
					action: "worker_close_error",
					error: error.message,
					timestamp: new Date().toISOString()
				});
			} finally {
				this.worker = null;
			}
		}
	}

	/**
	 * Força restart do worker (útil para reconexões)
	 */
	async restartWorker(): Promise<void> {
		this.logger.register("Info", "BULLMQ_WORKER", {
			action: "restarting",
			timestamp: new Date().toISOString()
		});
		
		await this.closeWorker();
		
		// Wait um pouco antes de tentar reconectar
		await new Promise(resolve => setTimeout(resolve, 2000));
		
		await this.initializeWorker();
	}

	/**
	 * Verifica se worker está ativo
	 */
	isWorkerActive(): boolean {
		return this.worker !== null && !this.worker.closing;
	}
}