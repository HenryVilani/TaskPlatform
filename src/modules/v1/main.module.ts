import { Module } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { AccountModule } from './account.module';
import { TasksModule } from './tasks.module';
import { APP_GUARD, APP_INTERCEPTOR, RouterModule } from '@nestjs/core';
import { DatabaseModule } from './database.module';
import { NotifyModule } from './notify.module';
import { ServerModule } from './server.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ObservabilityModule } from './observablity.module';
import { HealthCheckGuard } from 'src/infrastructure/health/health.guard';

/**
 * MainV1Module
 * 
 * This module serves as the main entry point for the API version v1.
 * It integrates all sub-modules, sets up routing, throttling, and global guards.
 * 
 * Features:
 * - Integrates core modules: AuthModule, AccountModule, TasksModule, DatabaseModule, NotifyModule, ServerModule
 * - Registers API routes under `/v1`
 * - Enables global request throttling using ThrottlerModule and ThrottlerGuard
 * - Integrates ObservabilityModule for monitoring and logging
 * 
 * Providers:
 * - ThrottlerGuard applied globally via APP_GUARD
 * 
 * Exports:
 * - All core modules for use in other parts of the application
 */
@Module({
	imports: [
		ServerModule,
		ObservabilityModule,
		AuthModule,
		DatabaseModule,
		AccountModule,
		TasksModule,
		NotifyModule,

		// API routing for v1
		RouterModule.register([
			{
				path: "v1",
				children: [
					{ path: "", module: AccountModule },
					{ path: "", module: AuthModule },
					{ path: "", module: TasksModule }
				]
			},
		]),

		// Request throttling configuration
		ThrottlerModule.forRoot({
			throttlers: [
				{
					ttl: 60000,   // Time to live for requests in milliseconds
					limit: 25,    // Max number of requests per TTL
				}
			]
		}),

	],
	controllers: [],
	providers: [
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard, // Apply global throttling guard
		},
		{
			provide: APP_GUARD,
			useClass: HealthCheckGuard
		}
	],
	exports: [
		AuthModule,
		DatabaseModule,
		AccountModule,
		TasksModule,
		NotifyModule,
		ServerModule,
	]
})
export class MainV1Module {}
