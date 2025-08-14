import { Module } from '@nestjs/common';
import { UpdateTaskUseCase } from '../../application/use-cases/tasks/update.usecase';
import { CreateTaskUseCase } from '../../application/use-cases/tasks/create.usecase';
import { DeleteTaskUseCase } from '../../application/use-cases/tasks/delete.usecase';
import { ListTaskUseCase } from '../../application/use-cases/tasks/list.usecase';
import { TaskController } from '../../interfaces/http/v1/task.controller';
import { DatabaseModule } from './database.module';
import { AuthModule } from './auth.module';
import { SchedulerTaskUseCase } from 'src/application/use-cases/tasks/scheduler.usecase';
import { NotifyModule } from './notify.module';

@Module({
	imports: [
		DatabaseModule, 
		AuthModule,
		NotifyModule,

	],
	controllers: [TaskController],
	providers: [

		CreateTaskUseCase,
		UpdateTaskUseCase,
		DeleteTaskUseCase,
		ListTaskUseCase,
		
	],
	exports: []
})
export class TasksModule {}
