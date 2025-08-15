import { Module } from '@nestjs/common';
import { BullMQTaskScheduler } from 'src/infrastructure/queue/bullmq/bullmq.scheduler';
import { NotifyGateway } from 'src/interfaces/ws/v1/notify.gateway';
import { AuthModule } from './auth.module';


@Module({
	imports: [AuthModule],
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