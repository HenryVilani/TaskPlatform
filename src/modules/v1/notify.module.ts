import { Module } from '@nestjs/common';
import { BullMQTaskScheduler } from 'src/infrastructure/queue/bullmq/bullmq.scheduler';
import { NotifyGateway } from 'src/interfaces/ws/v1/notify.gateway';
import { AuthModule } from './auth.module';
import { TasksModule } from './tasks.module';
import { DatabaseModule } from './database.module';


@Module({
	imports: [AuthModule, DatabaseModule],
	providers: [
		{
			provide: "ISchedulerRepository",
			useClass: BullMQTaskScheduler
		},
		NotifyGateway

	],
	exports: ['ISchedulerRepository'],
})
export class NotifyModule { }