import { Body, Controller, Logger, OnModuleDestroy, OnModuleInit, Post, UseGuards } from "@nestjs/common";
import { UserAuthDTO } from "./dtos/auth.dtos";
import { RegisterUserUseCase } from "src/application/use-cases/auth/register.usecase";
import { LoginUseCase } from "src/application/use-cases/auth/login.usecase";
import { StatusDTO } from "src/application/dtos/status.dto";
import { BaseError } from "src/application/erros/base.errors";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { HealthCheckGuard } from "src/infrastructure/health/health.guard";
import { LokiServiceImpl } from "src/infrastructure/observability/loki/loki.service.impl";
import { ILoggerRepository } from "src/application/services/logger.repository";
import { ConnectionManager } from "src/infrastructure/health/connection-manager";
import { NestLogServiceImpl } from "src/infrastructure/observability/nestLog/nestlog.service.impl";

@Controller()
export class AuthController implements OnModuleInit{

	private logger: ILoggerRepository | null = null;

	constructor(
		private readonly createUserUseCase: RegisterUserUseCase,
		private readonly loginUserUseCase: LoginUseCase,
		private readonly connectionManager: ConnectionManager
	) {}

	async onModuleInit() {
		
		this.logger = await this.connectionManager.getConnection<ILoggerRepository>("log", async () => new NestLogServiceImpl())

	}

	/**
	 * Endpoint to register a new user.
	 * Accepts email and password, validates, and creates user.
	 */
	@Post("register")
	@UseGuards(HealthCheckGuard)
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
			this.logger?.register("Info", "AUTH_CONTROLLER", {
				action: "register_attempt",
				email: body.email,
				timestamp: new Date().toISOString()
			});

			// Execute the registration use case
			const user = await this.createUserUseCase.execute(body.email, body.password);

			this.logger?.register("Info", "AUTH_CONTROLLER", {
				action: "register_success",
				userId: user.id,
				email: user.email,
				timestamp: new Date().toISOString()
			});

			// Return success with user id and email
			return new StatusDTO<{ id: string; email: string }>("registered", {
				id: user.id,
				email: user.email
			});

		} catch (error) {
			this.logger?.register("Error", "AUTH_CONTROLLER", {
				action: "register_failed",
				email: body.email,
				error: error instanceof BaseError ? error.id : error.message,
				timestamp: new Date().toISOString()
			});

			// Handle known errors via BaseError
			if (error instanceof BaseError) {
				return new StatusDTO(error.id);
			} else {
				// Log unknown errors and return generic status
				return new StatusDTO("unknown_error");
			}
		}
	}

	/**
	 * Endpoint to login a user.
	 * Accepts email and password, validates credentials, and returns a token.
	 */
	@Post("login")
	@UseGuards(HealthCheckGuard)
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
			this.logger?.register("Info", "AUTH_CONTROLLER", {
				action: "login_attempt",
				email: body.email,
				timestamp: new Date().toISOString()
			});

			// Execute login use case to validate credentials
			const result = await this.loginUserUseCase.execute(body.email, body.password);

			this.logger?.register("Info", "AUTH_CONTROLLER", {
				action: "login_success",
				email: body.email,
				timestamp: new Date().toISOString()
			});

			// Return success with JWT token
			return new StatusDTO<{ token: string }>("logged_in", { token: result.token });

		} catch (error) {
			this.logger?.register("Error", "AUTH_CONTROLLER", {
				action: "login_failed",
				email: body.email,
				error: error instanceof BaseError ? error.id : error.message,
				timestamp: new Date().toISOString()
			});

			// Handle known errors via BaseError
			if (error instanceof BaseError) {
				return new StatusDTO(error.id);
			} else {
				// Log unknown errors and return generic status
				return new StatusDTO("unknown_error");
			}
		}
	}
}