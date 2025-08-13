import { Module } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { AccountModule } from './account.module';
import { TasksModule } from './tasks.module';
import { RouterModule } from '@nestjs/core';



@Module({

	imports: [
		RouterModule.register([
			{
				path: "v1",
				module: AccountModule
			},
			{
				path: "v1",
				module: AuthModule
			},
			{
				path: "v1",
				module: TasksModule
			}
		]),
	],
	controllers: [],
	providers: []
})
export class MainV1Module {}
