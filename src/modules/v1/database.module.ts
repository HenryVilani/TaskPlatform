import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { PostgreSQLConfig } from 'src/infrastructure/database/postgresql/postgre.datasource';
import { TaskPostgreImpl } from 'src/infrastructure/database/postgresql/task.repository.impl';
import { UserPostgreImpl } from 'src/infrastructure/database/postgresql/user.repository.impl';
import { TaskSchema } from 'src/infrastructure/database/schemas/task.schema';
import { UserSchema } from 'src/infrastructure/database/schemas/user.schema';


@Module({
	imports: [
		TypeOrmModule.forRoot(PostgreSQLConfig as TypeOrmModuleOptions),
		TypeOrmModule.forFeature([UserSchema, TaskSchema])
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

	],
	exports: ['IUserRepository', 'ITaskRepository'],
})
export class DatabaseModule {}