import { Task } from "./task.entity";

export class TaskSegment {

	public readonly tasks: Task[];
	public readonly hasMore: boolean;
	public readonly cursor?: string;

	constructor(tasks: Task[], hasMore: boolean, nextTaskId?: string) {
		this.tasks = tasks;
		this.hasMore = hasMore;

		if (nextTaskId) {
			this.cursor = TaskSegment.toCursor(nextTaskId);
		}
	}


	public static toCursor(id: string): string {
		return Buffer.from(id, "utf-8").toString("base64");
	}


	public static fromCursor(cursor: string): string {
		return Buffer.from(cursor, "base64").toString("utf-8");
	}
	
}
