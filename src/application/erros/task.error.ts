import { BaseError } from "./base.errors";

/**
 * Error thrown when a task name is invalid.
 */
export class InvalidTaskName extends BaseError {
	/**
	 * Creates a new InvalidTaskName error.
	 */
	constructor() {
		super("invalid_task_name", "invalid_task_name", 400);
	}
}

/**
 * Error thrown when a task is not found.
 */
export class TaskNotFound extends BaseError {
	/**
	 * Creates a new TaskNotFound error.
	 */
	constructor() {
		super("task_not_found", "task_not_found", 400);
	}
}

/**
 * Error thrown when the user exceeds the allowed number of tasks.
 */
export class TaskLimitExceeded extends BaseError {
	/**
	 * Creates a new TaskLimitExceeded error.
	 */
	constructor() {
		super("task_limit_exceeded", "task_limit_exceeded", 400);
	}
}
