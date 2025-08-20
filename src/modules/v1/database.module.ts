import { Module } from '@nestjs/common';
import { PostgreSQLConfig } from 'src/infrastructure/database/postgresql/postgre.datasource';
import { TaskPostgreImpl } from 'src/infrastructure/database/postgresql/task.repository.impl';
import { UserPostgreImpl } from 'src/infrastructure/database/postgresql/user.repository.impl';
import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * DatabaseModule
 * 
 * This module handles all database-related configurations and repositories.
 * 
 * Features:
 * - Initializes TypeORM with PostgreSQL configuration
 * - Registers database schemas for User and Task entities
 * - Provides repository implementations for User and Task
 * 
 * Providers:
 * - IUserRepository (UserPostgreImpl): Repository for user entity operations
 * - ITaskRepository (TaskPostgreImpl): Repository for task entity operations
 * 
 * Exports:
 * - IUserRepository and ITaskRepository for use in other modules
 */
@Module({
	imports: [
		// TypeOrmModule.forRoot(PostgreSQLConfig as TypeOrmModuleOptions),
		// TypeOrmModule.forFeature([UserSchema, TaskSchema])
	],
	providers: [
		{
			provide: 'IUserRepository',
			useClass: UserPostgreImpl,
		},
		{
			provide: "ITaskRepository",
			useClass: TaskPostgreImpl
		},
		{
			provide: "Datasource",
			useFactory: async () => new DataSource(PostgreSQLConfig as DataSourceOptions)
		}
	],
	exports: ['IUserRepository', 'ITaskRepository'],
})
export class DatabaseModule {}
