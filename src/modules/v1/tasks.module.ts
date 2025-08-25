import { Module } from '@nestjs/common';
import { UpdateTaskUseCase } from '../../application/use-cases/tasks/update.usecase';
import { CreateTaskUseCase } from '../../application/use-cases/tasks/create.usecase';
import { DeleteTaskUseCase } from '../../application/use-cases/tasks/delete.usecase';
import { ListTaskUseCase } from '../../application/use-cases/tasks/list.usecase';
import { TaskController } from '../../interfaces/http/v1/task.controller';
import { DatabaseModule } from './database.module';
import { AuthModule } from './auth.module';
import { NotifyModule } from './notify.module';
import { ServerModule } from './server.module';
import { CoreModule } from './core.module';

/**
 * TasksModule
 * 
 * This module handles all task-related operations, including CRUD operations
 * and task scheduling/notifications.
 * 
 * Features:
 * - Create, update, delete, and list tasks
 * - Integrates with NotifyModule for task notifications
 * 
 * Controllers:
 * - TaskController: Handles HTTP requests for task operations
 * 
 * Providers:
 * - CreateTaskUseCase: Business logic for creating tasks
 * - UpdateTaskUseCase: Business logic for updating tasks
 * - DeleteTaskUseCase: Business logic for deleting tasks
 * - ListTaskUseCase: Business logic for listing tasks
 * - SchedulerTaskUseCase: Handles scheduling logic for tasks (imported but not explicitly listed in providers)
 * 
 * Imports:
 * - DatabaseModule: Access to database schemas and repositories
 * - AuthModule: Required for authentication and authorization
 * - NotifyModule: Enables WebSocket notifications for tasks
 * 
 * Exports:
 * - None
 */
@Module({
	imports: [
		CoreModule,
		DatabaseModule,
		AuthModule,
		NotifyModule,
		ServerModule
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
