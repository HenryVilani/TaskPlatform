import { Module } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { AccountModule } from './account.module';
import { TasksModule } from './tasks.module';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { DatabaseModule } from './database.module';
import { NotifyModule } from './notify.module';
import { ServerModule } from './server.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';


@Module({

	imports: [
		AuthModule,
		DatabaseModule,
		AccountModule,
		TasksModule,
		NotifyModule,
		ServerModule,

		RouterModule.register([
			{
				path: "v1",
				children: [
					{
						path: "",
						module: AccountModule
					},
					{
						path: "",
						module: AuthModule
					},
					{
						path: "",
						module: TasksModule
					}

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
