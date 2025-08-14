import { BaseError } from "./base.errors";

export class InvalidTaskName extends BaseError {

	constructor() {

		super("invalid_task_name", "invalid_task_name", 400);

	}

}

export class TaskNotFound extends BaseError {

	constructor() {

		super("task_not_found", "task_not_found", 400);

	}

}

export class TaskLimitExceeded extends BaseError {

	constructor() {

		super("task_limit_exceeded", "task_limit_exceeded", 400);

	}

}