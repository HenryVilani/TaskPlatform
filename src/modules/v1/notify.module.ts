import { Module } from '@nestjs/common';
import { BullMQTaskScheduler } from 'src/infrastructure/queue/bullmq/bullmq.scheduler';
import { NotifyGateway } from 'src/interfaces/ws/v1/notify.gateway';
import { AuthModule } from './auth.module';
import { DatabaseModule } from './database.module';
import { RedisServiceImpl } from 'src/infrastructure/queue/bullmq/redis.impl';
import { ServerModule } from './server.module';

/**
 * NotifyModule
 * 
 * This module handles real-time notifications and task scheduling.
 * 
 * Features:
 * - Provides WebSocket gateway for notifying users of task updates (NotifyGateway)
 * - Integrates with BullMQTaskScheduler for scheduling tasks
 * 
 * Integrations:
 * - AuthModule: Required for user authentication
 * - DatabaseModule: Required for accessing user and task data
 * 
 * Providers:
 * - ISchedulerRepository (BullMQTaskScheduler): Task scheduling implementation
 * - NotifyGateway: Handles WebSocket connections and notification events
 * 
 * Exports:
 * - ISchedulerRepository: Allows other modules to schedule tasks
 */
@Module({
	imports: [AuthModule, DatabaseModule, ServerModule, ServerModule],
	providers: [
		{
			provide: "ISchedulerRepository",
			useClass: BullMQTaskScheduler
		},
		NotifyGateway,		
		RedisServiceImpl
	],
	exports: ['ISchedulerRepository'],
})
export class NotifyModule {}
