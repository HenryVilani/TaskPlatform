import { Module } from '@nestjs/common';
import { AuthModule } from './auth.module';
import { AccountModule } from './account.module';
import { TasksModule } from './tasks.module';
import { RouterModule } from '@nestjs/core';
import { DatabaseModule } from './database.module';
import { DataSource } from 'typeorm';



@Module({

	imports: [
		AuthModule,
		DatabaseModule,
		AccountModule,
		TasksModule,
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
	],
	controllers: [],
	providers: [],
	exports: [AuthModule, AccountModule, TasksModule]
})
export class MainV1Module {}
