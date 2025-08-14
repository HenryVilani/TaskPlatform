import { Body, Controller, Logger, Post } from "@nestjs/common";
import { UserAuthDTO } from "./dtos/auth.dtos";
import { RegisterUserUseCase } from "src/application/use-cases/auth/register.usecase";
import { LoginUseCase } from "src/application/use-cases/auth/login.usecase";
import { StatusDTO } from "src/application/dtos/output/status.out.dto";
import { BaseError } from "src/application/erros/base.errors";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";

@Controller()
export class AuthController {

    constructor (
		private readonly createUserUseCase: RegisterUserUseCase,
		private readonly loginUserUseCase: LoginUseCase
	) {}

	@Post("register")
	@ApiOperation({ summary: "Register" })
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

			const user = await this.createUserUseCase.execute(body.email, body.password);

			return new StatusDTO<{id: string; email: string}>("registered", {id: user.id,email: user.email});

		}catch(error) {

			if (error instanceof BaseError) {

				return new StatusDTO(error.id);

			}else {
				
				Logger.log(error)
				return new StatusDTO("unknown_error");

			}

		}

	}

	@Post("login")
	@ApiOperation({ summary: "Login" })
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

			const result = await this.loginUserUseCase.execute(body.email, body.password);

			return new StatusDTO<{token: string}>("logged_in", {token: result.token});

		}catch (error) {

			if (error instanceof BaseError) {

				return new StatusDTO(error.id);

			}else {

				Logger.log(error)
				return new StatusDTO("unknown_error");

			}

		}


	}

}
