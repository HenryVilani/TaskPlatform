import { Module } from '@nestjs/common';
import { BullMQTaskScheduler } from 'src/infrastructure/queue/bullmq/bullmq.scheduler';


@Module({
	imports: [],
	providers: [
		{
			provide: "ISchedulerRepository",
			useClass: BullMQTaskScheduler
		},

	],
	exports: ['ISchedulerRepository'],
})
export class NotifyModule { }