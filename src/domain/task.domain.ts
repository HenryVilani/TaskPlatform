import { DateTime } from "luxon";
import { InvalidTaskName } from "src/application/erros/task.error";
import { User } from "./user.domain";


export class TaskName {

	public validatedName: string;

	constructor(private name: string) {}

	async validate(): Promise<TaskName> {

		const trimmed = this.name.trim();

		if (trimmed.length < 1 || trimmed.length > 40) {

		  throw new InvalidTaskName();

		}
	
		this.validatedName = trimmed;

		return this;

	}

}


export class Task {

	constructor(
		public readonly user: User,
		public readonly id: string,
		public name: TaskName,
		public content: string,
		public createdAt: DateTime,
		public updatedAt: DateTime,
		public notifyAt: DateTime | null
	) {}

}

export class TaskSegment {

	tasks: Task[];
	cursor?: string;

	hasMore: boolean;

	constructor(tasks: Task[], hasMore: boolean, nextTask?: string) {
		this.tasks = tasks;
		this.hasMore = hasMore;
		if (nextTask) {
			
			this.cursor = TaskSegment.toCursor(nextTask);
			
		}
		
	}

	static toCursor(id: string) {

		return Buffer.from(id, "utf-8").toString("base64");

	}

	static fromCursor(cursor: string) {

		return Buffer.from(cursor, "base64").toString("utf-8");

	}

}