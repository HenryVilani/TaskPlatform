import { Body, Controller, Logger, Post } from "@nestjs/common";
import { UserAuthDTO } from "./dtos/auth.dtos";
import { RegisterUserUseCase } from "src/application/use-cases/auth/register.usecase";
import { LoginUseCase } from "src/application/use-cases/auth/login.usecase";
import { StatusDTO } from "src/application/dtos/status.dto";
import { BaseError } from "src/application/erros/base.errors";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";

@Controller()
export class AuthController {

	constructor(
		private readonly createUserUseCase: RegisterUserUseCase,
		private readonly loginUserUseCase: LoginUseCase
	) {}

	/**
	 * Endpoint to register a new user.
	 * Accepts email and password, validates, and creates user.
	 */
	@Post("register")
	@ApiOperation({
		summary: "Register",
		description: "Register new user"
	})
	@ApiResponse({
		status: 200,
		description: "User registered successfully",
		type: StatusDTO
	})
	@ApiResponse({
		status: 400,
		description: "Error",
		type: StatusDTO<string>,
		examples: {
			"user_already_exists": {
				summary: "User already exists",
				value: new StatusDTO("user_already_exists")
			},
			"password_is_not_valid": {
				summary: "Password is not valid",
				value: new StatusDTO("password_is_not_valid")
			},
			"email_is_not_valid": {
				summary: "Email is not valid",
				value: new StatusDTO("email_is_not_valid")
			},
			"unknown_error": {
				summary: "Unknown error",
				value: new StatusDTO("unknown_error")
			},
		},
	})
	async registerUser(@Body() body: UserAuthDTO) {
		try {
			// Execute the registration use case
			const user = await this.createUserUseCase.execute(body.email, body.password);

			// Return success with user id and email
			return new StatusDTO<{ id: string; email: string }>("registered", {
				id: user.id,
				email: user.email
			});

		} catch (error) {
			// Handle known errors via BaseError
			if (error instanceof BaseError) {
				return new StatusDTO(error.id);
			} else {
				// Log unknown errors and return generic status
				Logger.log(error)
				return new StatusDTO("unknown_error");
			}
		}
	}

	/**
	 * Endpoint to login a user.
	 * Accepts email and password, validates credentials, and returns a token.
	 */
	@Post("login")
	@ApiOperation({
		summary: "Login",
		description: "Login user and return a token"
	})
	@ApiResponse({
		status: 200,
		description: "User logged in successfully",
		type: StatusDTO
	})
	@ApiResponse({
		status: 400,
		description: "Error",
		type: StatusDTO<string>,
		examples: {
			"wrong_credentials": {
				summary: "Wrong credentials",
				value: new StatusDTO("wrong_credentials")
			},
			"password_is_not_valid": {
				summary: "Password is not valid",
				value: new StatusDTO("password_is_not_valid")
			},
			"email_is_not_valid": {
				summary: "Email is not valid",
				value: new StatusDTO("email_is_not_valid")
			},
			"unknown_error": {
				summary: "Unknown error",
				value: new StatusDTO("unknown_error")
			},
		},
	})
	async loginUser(@Body() body: UserAuthDTO) {
		try {
			// Execute login use case to validate credentials
			const result = await this.loginUserUseCase.execute(body.email, body.password);

			// Return success with JWT token
			return new StatusDTO<{ token: string }>("logged_in", { token: result.token });

		} catch (error) {
			// Handle known errors via BaseError
			if (error instanceof BaseError) {
				return new StatusDTO(error.id);
			} else {
				// Log unknown errors and return generic status
				Logger.log(error)
				return new StatusDTO("unknown_error");
			}
		}
	}
}
