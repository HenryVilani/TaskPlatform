import { Task } from "./task.entity";

/**
 * Represents a segment of tasks with pagination support.
 */
export class TaskSegment {
	/**
	 * Array of tasks in this segment.
	 */
	public readonly tasks: Task[];

	/**
	 * Indicates if there are more tasks available after this segment.
	 */
	public readonly hasMore: boolean;

	/**
	 * Cursor for fetching the next segment of tasks, encoded in base64.
	 */
	public readonly cursor?: string;

	/**
	 * Creates a new TaskSegment instance.
	 * @param tasks The array of Task entities in this segment.
	 * @param hasMore Whether there are more tasks after this segment.
	 * @param nextTaskId Optional ID of the next task used to generate the cursor.
	 */
	constructor(tasks: Task[], hasMore: boolean, nextTaskId?: string) {
		this.tasks = tasks;
		this.hasMore = hasMore;

		if (nextTaskId) {
			this.cursor = TaskSegment.toCursor(nextTaskId);
		}
	}

	/**
	 * Converts a task ID into a base64-encoded cursor.
	 * @param id The task ID to encode.
	 * @returns The base64-encoded cursor string.
	 */
	public static toCursor(id: string): string {
		return Buffer.from(id, "utf-8").toString("base64");
	}

	/**
	 * Decodes a base64 cursor back into the original task ID.
	 * @param cursor The base64-encoded cursor string.
	 * @returns The decoded task ID.
	 */
	public static fromCursor(cursor: string): string {
		return Buffer.from(cursor, "base64").toString("utf-8");
	}
}
