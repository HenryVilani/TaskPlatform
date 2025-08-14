import { BaseError } from "./base.errors";

export class UserAlreadyExists extends BaseError {

	constructor(email: string) {

		super("user_already_exists", email, 400);

	}

}

export class UserNotFound extends BaseError {

	constructor() {

		super("user_not_found", "user_not_found", 400);

	}

}

export class PasswordIsNotValid extends BaseError {

	constructor() {

		super("password_is_not_valid", "password_is_not_valid", 400);

	}

}

export class EmailIsNotValid extends BaseError {

	constructor() {

		super("email_is_not_valid", "email_is_not_valid", 400);

	}

}

export class WrongCredentials extends BaseError {

	constructor() {

		super("wrong_credentials", "wrong_credentials", 400);

	}

}

export class InvalidToken extends BaseError {

	constructor() {

		super("invalid_token", "invalid_token", 400);


	}

}

export class InvalidId extends BaseError {

	constructor() {

		super("invalid_id", "invalid_id", 400);

	}

}
