import { Injectable, Logger } from "@nestjs/common";
import { MainDataSource } from "../datasource";
import { TaskSchema } from "../schemas/task.schema";
import { ITaskRepository } from "src/application/repositories/task.repository";
import { Task, TaskName } from "src/domain/task.domain";
import { DateTime } from "luxon";
import { Email, Password, User } from "src/domain/user.domain";
import { UserSchema } from "../schemas/user.schema";
import { UserNotFound } from "src/application/erros/auth.errors";

@Injectable()
export class TaskSQLiteImpl implements ITaskRepository {

	private tasksRepository = MainDataSource.getRepository(TaskSchema);
	private userRepository = MainDataSource.getRepository(UserSchema);

	async create(user: User, task: Task): Promise<Task> {
		
		await this.tasksRepository.insert({
			id: task.id,
			name: task.name.validatedName,
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
			task.notifyAt
		);

	}

	async delete(user: User, task: Task): Promise<void> {

		await this.tasksRepository.delete({ id: task.id, user_id: user.id });

	}

	async update(user: User, task: Task): Promise<Task> {
		
		await this.tasksRepository.update({id: task.id, user_id: user.id}, {
			name: task.name.validatedName,
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
			task.notifyAt
		);

	}

	async findTaskById(user: User, id: string): Promise<Task | null> {
		
		const result = await this.tasksRepository.findOneBy({
			id: id,
			user_id: user.id
		});

		if (!result) return null;

		return new Task(
			user,
			result.id,
			await new TaskName(result.name).validate(),
			result.content,
			DateTime.fromISO(result.created_at),
			DateTime.fromISO(result.updated_at),
			result.notify_at ? DateTime.fromISO(result.notify_at) : null
		);

	}

	async findTasksByUser(user: User): Promise<Task[]> {
		
		const result = await this.tasksRepository.findBy({
			user_id: user.id
		});

		let tasks: Task[] = [];

		for (let schema of result) {

			tasks.push(

				new Task(
					user,
					schema.id,
					await new TaskName(schema.name).validate(),
					schema.content,
					DateTime.fromISO(schema.created_at),
					DateTime.fromISO(schema.updated_at),
					schema.notify_at ? DateTime.fromISO(schema.notify_at) : null
				)

			)

		}

		return tasks;

	}

}
