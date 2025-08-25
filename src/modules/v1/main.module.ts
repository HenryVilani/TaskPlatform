import { Module } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { AccountModule } from './account.module';
import { TasksModule } from './tasks.module';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { DatabaseModule } from './database.module';
import { NotifyModule } from './notify.module';
import { ServerModule } from './server.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ObservabilityModule } from './observablity.module';
import { HealthCheckGuard } from 'src/infrastructure/health/health.guard';
import { CoreModule } from './core.module';

/**
 * MainV1Module with Lazy Loading Support
 * 
 * Standard module imports. CoreModule is imported first to ensure services
 * are available for lazy loading by other modules.
 * 
 * @export
 * @class MainV1Module
 */
@Module({
	imports: [
		/**
		 * CoreModule first - provides services for lazy loading
		 */
		CoreModule,

		/**
		 * ObservabilityModule - will lazy load CoreModule services
		 */
		ObservabilityModule,

		/**
		 * Other modules in standard order
		 */
		ServerModule,
		AuthModule,
		DatabaseModule,
		AccountModule,
		TasksModule,
		NotifyModule,

		/**
		 * Routing and throttling configuration
		 */
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

		ThrottlerModule.forRoot({
			throttlers: [
				{
					ttl: 60000,
					limit: 25,
				}
			]
		}),
	],
	controllers: [],
	providers: [
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
		{
			provide: APP_GUARD,
			useClass: HealthCheckGuard
		}
	],
	exports: [
		CoreModule,
		ObservabilityModule,
		ServerModule,
		AuthModule,
		DatabaseModule,
		AccountModule,
		TasksModule,
		NotifyModule,
	]
})
export class MainV1Module {}