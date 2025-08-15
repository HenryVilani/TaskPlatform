import { Module } from '@nestjs/common';
import { BullMQTaskScheduler } from 'src/infrastructure/queue/bullmq/bullmq.scheduler';
import { NotifyGateway } from 'src/interfaces/ws/v1/notify.gateway';


@Module({
	imports: [],
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