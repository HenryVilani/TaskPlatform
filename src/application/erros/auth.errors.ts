import { BaseError } from "./base.errors";

/**
 * Error thrown when trying to create a user that already exists.
 */
export class UserAlreadyExists extends BaseError {
	/**
	 * @param email Email of the user that already exists.
	 */
	constructor(email: string) {
		super("user_already_exists", email, 400);
	}
}

/**
 * Error thrown when a user is not found.
 */
export class UserNotFound extends BaseError {
	constructor() {
		super("user_not_found", "user_not_found", 400);
	}
}

/**
 * Error thrown when the provided password is invalid.
 */
export class PasswordIsNotValid extends BaseError {
	constructor() {
		super("password_is_not_valid", "password_is_not_valid", 400);
	}
}

/**
 * Error thrown when the provided email is invalid.
 */
export class EmailIsNotValid extends BaseError {
	constructor() {
		super("email_is_not_valid", "email_is_not_valid", 400);
	}
}

/**
 * Error thrown when credentials are incorrect.
 */
export class WrongCredentials extends BaseError {
	constructor() {
		super("wrong_credentials", "wrong_credentials", 400);
	}
}

/**
 * Error thrown when a provided token is invalid.
 */
export class InvalidToken extends BaseError {
	constructor() {
		super("invalid_token", "invalid_token", 400);
	}
}

/**
 * Error thrown when an ID provided is invalid.
 */
export class InvalidId extends BaseError {
	constructor() {
		super("invalid_id", "invalid_id", 400);
	}
}
