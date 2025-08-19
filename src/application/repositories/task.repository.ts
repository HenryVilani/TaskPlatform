import { TaskSegment } from "src/domain/task/task-segment";
import { Task } from "src/domain/task/task.entity";
import { User } from "src/domain/user/user.entity";

/**
 * Interface for task-related repository operations.
 */
export interface ITaskRepository {
	/**
	 * Creates a new task for a user.
	 * @param user The user who owns the task.
	 * @param task The task entity to create.
	 * @returns A promise that resolves to the created Task.
	 */
	create(user: User, task: Task): Promise<Task>;

	/**
	 * Updates an existing task for a user.
	 * @param user The user who owns the task.
	 * @param task The task entity with updated data.
	 * @returns A promise that resolves to the updated Task.
	 */
	update(user: User, task: Task): Promise<Task>;

	/**
	 * Deletes a task for a user.
	 * @param user The user who owns the task.
	 * @param task The task entity to delete.
	 * @returns A promise that resolves when the task has been deleted.
	 */
	delete(user: User, task: Task): Promise<void>;

	/**
	 * Finds a task by its ID for a specific user.
	 * @param user The user who owns the task.
	 * @param id The unique identifier of the task.
	 * @returns A promise that resolves to the Task if found, or null if not found.
	 */
	findById(user: User, id: string): Promise<Task | null>;

	/**
	 * Finds all tasks belonging to a user.
	 * @param user The user whose tasks are being retrieved.
	 * @returns A promise that resolves to an array of Tasks.
	 */
	findAllByUser(user: User): Promise<Task[]>;

	/**
	 * Retrieves tasks in segments (pagination) for a user.
	 * @param user The user whose tasks are being retrieved.
	 * @param limit Maximum number of tasks to return in this segment.
	 * @param cursor Optional cursor for pagination.
	 * @returns A promise that resolves to a TaskSegment containing tasks and pagination info.
	 */
	getAllBySegment(user: User, limit: number, cursor?: string): Promise<TaskSegment>;
}
