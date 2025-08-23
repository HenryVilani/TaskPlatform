import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Job, Worker } from "bullmq";
import { Task } from "src/domain/task/task.entity";
import { RedisServiceImpl } from "./redis.impl";

/**
 * BullMQ Worker Service melhorado com health check integration
 * Publishes task notifications to Redis channels apenas se Redis estiver healthy
 */
@Injectable()
export class BullMQWorkerService implements OnModuleInit, OnModuleDestroy {

	private readonly logger = new Logger(BullMQWorkerService.name);
	private worker: Worker | null = null;

	constructor(
		private readonly redisService: RedisServiceImpl
	) {}

	/**
	 * Lifecycle hook - inicializa worker apenas se Redis estiver healthy
	 */
	async onModuleInit() {
		this.logger.log("🚀 Initializing BullMQ Worker");
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
				this.closeWorker();
			});

		} catch (error) {

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

			this.logger.log(`📢 Notification sent for task ${task.id} to user ${task.user.id}`);

		} catch (error) {
			this.logger.error(`💥 Failed to process notification for task ${task.id}: ${error.message}`);
			
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
				this.logger.log(`🔌 Worker closed successfully`);
			} catch (error) {
				this.logger.error(`Error closing worker: ${error.message}`);
			} finally {
				this.worker = null;
			}
		}
	}

	/**
	 * Força restart do worker (útil para reconexões)
	 */
	async restartWorker(): Promise<void> {
		this.logger.log(`🔄 Restarting worker...`);
		
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