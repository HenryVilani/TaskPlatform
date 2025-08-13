import { Body, Controller, Get, Logger, Post, Req, UseGuards } from "@nestjs/common";
import { type IDTOLoginUser, type IDTORegisterUser } from "./dtos/auth.dtos";
import { RegisterUserUseCase } from "src/application/use-cases/auth/register.usecase";
import { AuthGuard } from "@nestjs/passport";
import { LoginUseCase } from "src/application/use-cases/auth/login.usecase";
import { type Request } from "express";
import { EmailIsNotValid, PasswordIsNotValid, UserAlreadyExists, WrongCredentials } from "src/application/erros/auth.errors";
import { StatusOutDTO } from "src/application/dtos/output/status.out.dto";
import { BaseError } from "src/application/erros/base.errors";

@Controller()
export class AuthController {

    constructor (
		private readonly createUserUseCase: RegisterUserUseCase,
		private readonly loginUserUseCase: LoginUseCase
	) {}

	@UseGuards(AuthGuard('jwt'))
    @Get("me")
    getMeInfo(@Req() req: Request) {

		console.log(req.user)

        return {
            ...req.user
        }

    }

	@Post("register")
	async registerUser(@Body() body: IDTORegisterUser) {

		try {

			const user = await this.createUserUseCase.execute(body.email, body.password);

			return new StatusOutDTO<{id: string; email: string}>("registered", {id: user.id,email: user.email}).toDict();

		}catch(error) {

			if (error instanceof BaseError) {

				return new StatusOutDTO(error.responseMessage).toDict();

			}else {
				
				Logger.log(error)
				return new StatusOutDTO("unknown_error").toDict();

			}

		}

	}

	@Post("login")
	async loginUser(@Body() body: IDTOLoginUser) {

		try {

			const result = await this.loginUserUseCase.execute(body.email, body.password);

			return new StatusOutDTO<{token: string}>("logged_in", {token: result.token});

		}catch (error) {

			if (error instanceof WrongCredentials || 
				error instanceof EmailIsNotValid ||
				error instanceof PasswordIsNotValid
			) {

				return new StatusOutDTO(error.responseMessage);

			}else {

				Logger.log(error)
				return new StatusOutDTO("unknown_error");

			}

		}


	}

}
