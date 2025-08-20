import { Inject, Injectable, Logger } from "@nestjs/common";
import { TaskSchema } from "../schemas/task.schema";
import { ITaskRepository } from "src/application/repositories/task.repository";
import { DateTime } from "luxon";
import { User } from "src/domain/user/user.entity";
import { Task, TaskNotifyType } from "src/domain/task/task.entity";
import { TaskName } from "src/domain/task/task-name.value-object";
import { TaskSegment } from "src/domain/task/task-segment";
import { DataSource, Repository } from "typeorm";

/**
 * PostgreSQL implementation of the ITaskRepository interface using TypeORM.
 */
@Injectable()
export class TaskPostgreImpl implements ITaskRepository {
	
	private taskTable: Repository<TaskSchema>;

	constructor(
		@Inject("Datasource") private readonly datasource: DataSource
	) {
		this.taskTable = datasource.getRepository(TaskSchema);
	}

	/** Repository for the task table */

	/**
	 * Creates a new task in the database for the given user.
	 * @param user - The owner of the task.
	 * @param task - Task entity to create.
	 * @returns The created Task entity.
	 */
	async create(user: User, task: Task): Promise<Task> {
		await this.taskTable.insert({
			id: task.id,
			name: task.name.value,
			content: task.content,
			created_at: DateTime.now().toISO(),
			updated_at: DateTime.now().toISO(),
			notify_at: task.notifyAt ? task.notifyAt.toISO() : null,
			notify_status: task.notifyStatus,
			notify_type: task.notifyType,
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
			task.notifyStatus,
			task.notifyType
		);
	}

	/**
	 * Deletes a task from the database for the given user.
	 * @param user - Owner of the task.
	 * @param task - Task entity to delete.
	 */
	async delete(user: User, task: Task): Promise<void> {
		await this.taskTable.delete({ id: task.id, user_id: user.id });
	}

	/**
	 * Updates a task in the database for the given user.
	 * @param user - Owner of the task.
	 * @param task - Task entity with updated information.
	 * @returns The updated Task entity.
	 */
	async update(user: User, task: Task): Promise<Task> {
		await this.taskTable.update({ id: task.id, user_id: user.id }, {
			name: task.name.value,
			content: task.content,
			updated_at: DateTime.now().toISO(),
			notify_at: task.notifyAt ? task.notifyAt.toISO() : null,
			notify_status: task.notifyStatus,
			notify_type: task.notifyType
		});

		return new Task(
			user,
			task.id,
			task.name,
			task.content,
			DateTime.now(),
			DateTime.now(),
			task.notifyAt,
			task.notifyStatus,
			task.notifyType
		);
	}

	/**
	 * Finds a task by its ID for a specific user.
	 * @param user - Owner of the task.
	 * @param id - Task ID to search for.
	 * @returns The Task entity if found, otherwise null.
	 */
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
			result.notify_status,
			result.notify_type as TaskNotifyType
		);
	}

	/**
	 * Finds all tasks for a specific user.
	 * @param user - Owner of the tasks.
	 * @returns Array of Task entities.
	 */
	async findAllByUser(user: User): Promise<Task[]> {
		const result = await this.taskTable.findBy({ user_id: user.id });
		return result.map(schema =>
			new Task(
				user,
				schema.id,
				TaskName.create(schema.name),
				schema.content,
				DateTime.fromISO(schema.created_at),
				DateTime.fromISO(schema.updated_at),
				schema.notify_at ? DateTime.fromISO(schema.notify_at) : null,
				schema.notify_status,
				schema.notify_type
			)
		);
	}

	/**
	 * Retrieves tasks in a paginated segment for a user.
	 * @param user - Owner of the tasks.
	 * @param limit - Maximum number of tasks to return.
	 * @param cursor - Optional cursor to continue from a previous segment.
	 * @returns A TaskSegment containing tasks, hasMore flag, and next cursor.
	 */
	async getAllBySegment(user: User, limit: number, cursor?: string): Promise<TaskSegment> {
		const query = this.taskTable.createQueryBuilder("task")
			.where("task.user_id = :userId", { userId: user.id })
			.orderBy("task.id", "ASC")
			.limit(limit + 1);

		if (cursor) {
			const taskId = TaskSegment.fromCursor(cursor);
			Logger.log(`CURSOR DECODED: ${taskId}`);
			query.andWhere("task.id > :taskId", { taskId });
		}

		let taskSchemas = await query.getMany();
		const hasMore = taskSchemas.length > limit;

		taskSchemas = taskSchemas.slice(0, limit);
		const tasks: Task[] = taskSchemas.map(schema =>
			new Task(
				user,
				schema.id,
				TaskName.create(schema.name),
				schema.content,
				DateTime.fromISO(schema.created_at),
				DateTime.fromISO(schema.updated_at),
				schema.notify_at ? DateTime.fromISO(schema.notify_at) : null,
				schema.notify_status,
				schema.notify_type
			)
		);

		return new TaskSegment(tasks, hasMore, hasMore ? tasks[tasks.length - 1].id : undefined);
	}
}
