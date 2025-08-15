import { Injectable, Logger } from "@nestjs/common";
import { MainDataSource } from "../datasource";
import { TaskSchema } from "../schemas/task.schema";
import { ITaskRepository } from "src/application/repositories/task.repository";
import { DateTime } from "luxon";
import { Task, TaskNotifyType } from "src/domain/task/task.entity";
import { User } from "src/domain/user/user.entity";
import { TaskName } from "src/domain/task/task-name.value-object";
import { TaskSegment } from "src/domain/task/task-segment";


@Injectable()
export class TaskSQLiteImpl implements ITaskRepository {

	private taskTable = MainDataSource.getRepository(TaskSchema);

	async create(user: User, task: Task): Promise<Task> {
		
		await this.taskTable.insert({
			id: task.id,
			name: task.name.value,
			content: task.content,
			created_at: DateTime.now().toISO(),
			updated_at: DateTime.now().toISO(),
			notify_at: task.notifyAt ?  task.notifyAt.toISO() : null,
			user_id: user.id
		});

		return new Task(
			user,
			task.id,
			task.name,
			task.content,
			DateTime.now(),
			DateTime.now(),
			task.notifyAt,
			task.notified,
			task.notifyType
		);

	}

	async delete(user: User, task: Task): Promise<void> {

		await this.taskTable.delete({ id: task.id, user_id: user.id });

	}

	async update(user: User, task: Task): Promise<Task> {
		
		await this.taskTable.update({id: task.id, user_id: user.id}, {
			name: task.name.value,
			content: task.content,
			updated_at: DateTime.now().toISO(),
			notify_at: task.notifyAt ? task.notifyAt.toISO() : null
		});

		return new Task(
			user,
			task.id,
			task.name,
			task.content,
			DateTime.now(),
			DateTime.now(),
			task.notifyAt,
			task.notified,
			task.notifyType
		);

	}

	async findById(user: User, id: string): Promise<Task | null> {
		
		const result = await this.taskTable.findOneBy({
			id: id,
			user_id: user.id
		});

		if (!result) return null;

		return new Task(
			user,
			result.id,
			TaskName.create(result.name),
			result.content,
			DateTime.fromISO(result.created_at),
			DateTime.fromISO(result.updated_at),
			result.notify_at ? DateTime.fromISO(result.notify_at) : null,
			result.notified,
			result.notify_type as TaskNotifyType
		);

	}

	async findAllByUser(user: User): Promise<Task[]> {
		
		const result = await this.taskTable.findBy({
			user_id: user.id
		});

		let tasks: Task[] = [];

		for (let schema of result) {

			tasks.push(

				new Task(
					user,
					schema.id,
					TaskName.create(schema.name),
					schema.content,
					DateTime.fromISO(schema.created_at),
					DateTime.fromISO(schema.updated_at),
					schema.notify_at ? DateTime.fromISO(schema.notify_at) : null,
					schema.notified,
					schema.notify_type as TaskNotifyType
				)

			)

		}

		return tasks;

	}

	async getAllBySegment(user: User, limit: number, cursor?: string): Promise<TaskSegment> {
		
		const query = this.taskTable.createQueryBuilder("task")
		.where("task.user_id = :userId", {userId: user.id})
		.orderBy("task.id", "ASC")
		.limit(limit + 1);
		
		if (cursor) {
			
			const taskId = TaskSegment.fromCursor(cursor);
			Logger.log(`CURSOR DECODED: ${taskId}`);
			query.andWhere("task.id > :taskId", { taskId });

		}

		var taskSchemas = await query.getMany();
		const hasMore = taskSchemas.length > limit;

		taskSchemas = taskSchemas.slice(0, limit);

		const tasks: Task[] = [];

		for (let schema of taskSchemas) {

			tasks.push(new Task(
				user, 
				schema.id,
				TaskName.create(schema.name),
				schema.content,
				DateTime.fromISO(schema.created_at),
				DateTime.fromISO(schema.updated_at),
				schema.notify_at ? DateTime.fromISO(schema.notify_at) : null,
				schema.notified,
				schema.notify_type as TaskNotifyType
			));

			
		}
		
		return new TaskSegment(tasks, hasMore, hasMore ? tasks[tasks.length - 1].id : undefined);
		

	}

}
