import { Injectable } from "@nestjs/common";
import { ITaskRepository } from "src/application/repositories/task.repository";
import { Task } from "src/domain/task/task.entity";
import { User } from "src/domain/user/user.entity";
import { TaskSegment } from "src/domain/task/task-segment";
import { TaskNotFound } from "src/application/erros/task.error";

/**
 * In-memory implementation of ITaskRepository.
 * Stores tasks in a static array for testing or development purposes.
 */
@Injectable()
export class TaskInMemoryRepository implements ITaskRepository {
	/** Static array holding all tasks in memory */
	private static tasks: Task[] = [];

	/**
	 * Creates a new task for the given user.
	 * @param user The owner of the task.
	 * @param task The task to be created.
	 * @returns The created task.
	 */
	async create(user: User, task: Task): Promise<Task> {
		TaskInMemoryRepository.tasks.push(task);
		return task;
	}

	/**
	 * Updates an existing task for the given user.
	 * @param user The owner of the task.
	 * @param task The task with updated data.
	 * @returns The updated task.
	 * @throws Error if the task does not exist for the user.
	 */
	async update(user: User, task: Task): Promise<Task> {
		const index = TaskInMemoryRepository.tasks.findIndex(
			(t) => t.id === task.id && t.user.id === user.id
		);

		if (index === -1) {
			throw new TaskNotFound();
		}

		TaskInMemoryRepository.tasks[index] = task;
		return task;
	}

	/**
	 * Deletes a task for the given user.
	 * @param user The owner of the task.
	 * @param task The task to delete.
	 */
	async delete(user: User, task: Task): Promise<void> {
		TaskInMemoryRepository.tasks = TaskInMemoryRepository.tasks.filter(
			(t) => !(t.id === task.id && t.user.id === user.id)
		);
	}

	/**
	 * Finds a task by its ID for a specific user.
	 * @param user The owner of the task.
	 * @param id The ID of the task.
	 * @returns The task if found, or null otherwise.
	 */
	async findById(user: User, id: string): Promise<Task | null> {
		const task = TaskInMemoryRepository.tasks.find(
			(t) => t.id === id && t.user.id === user.id
		);
		return task || null;
	}

	/**
	 * Returns all tasks for a specific user.
	 * @param user The owner of the tasks.
	 * @returns An array of tasks belonging to the user.
	 */
	async findAllByUser(user: User): Promise<Task[]> {
		return TaskInMemoryRepository.tasks.filter((t) => t.user.id === user.id);
	}

	/**
	 * Retrieves a segment of tasks for pagination purposes.
	 * @param user The owner of the tasks.
	 * @param limit Maximum number of tasks to return.
	 * @param cursor Optional cursor indicating the starting point for the segment.
	 * @returns A TaskSegment containing the tasks, whether more tasks exist, and a cursor.
	 */
	async getAllBySegment(user: User, limit: number, cursor?: string): Promise<TaskSegment> {
		let userTasks = TaskInMemoryRepository.tasks
			.filter((t) => t.user.id === user.id)
			.sort((a, b) => a.id.localeCompare(b.id));

		if (cursor) {
			const lastId = TaskSegment.fromCursor(cursor);
			userTasks = userTasks.filter((t) => t.id > lastId);
		}

		const hasMore = userTasks.length > limit;
		const segmentTasks = userTasks.slice(0, limit);

		return new TaskSegment(
			segmentTasks,
			hasMore,
			hasMore ? TaskSegment.toCursor(segmentTasks[segmentTasks.length - 1].id) : undefined
		);
	}
}
