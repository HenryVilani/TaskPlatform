import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { type IDTOLoginUser, type IDTORegisterUser } from "./dtos/auth.dtos";
import { RegisterUserUseCase } from "src/application/use-cases/auth/register.usecase";
import { AuthGuard } from "@nestjs/passport";
import { LoginUseCase } from "src/application/use-cases/auth/login.usecase";
import { type Request } from "express";
import { DeleteAccountUseCase } from "src/application/use-cases/account/delete.usecase";
import { ITokenDataInDTO } from "../../../application/dtos/input/token.in.dto";
import { UserNotFound } from "src/application/erros/auth.errors";
import { StatusOutDTO } from "src/application/dtos/output/status.out.dto";
import { InfoAccountUseCase } from "src/application/use-cases/account/info.usecase";
import { IAccountOutDTO } from "./dtos/account.dtos";
import { BaseError } from "src/application/erros/base.errors";

@Controller("account")
export class AccoutController {

    constructor (
		private readonly deleteAccountUseCase: DeleteAccountUseCase,
		private readonly infoAccountUseCase: InfoAccountUseCase
	) {}

	@UseGuards(AuthGuard('jwt'))
    @Get("me")
    async meAccount(@Req() request: Request) {

		try {

			const user = await this.infoAccountUseCase.execute(request.user as ITokenDataInDTO);
			
			return new StatusOutDTO<IAccountOutDTO>("me", {
				id: user.id,
				email: user.email.validatedEmail
			}).toDict();

		}catch (error) {

			if (error instanceof BaseError) {

				return new StatusOutDTO(error.responseMessage).toDict();

			}else {

				return new StatusOutDTO("unknown_error").toDict();

			}

		}

    }

	@UseGuards(AuthGuard('jwt'))
	@Post("delete")
	async deleteAccount(@Req() request: Request) {

		try {

			await this.deleteAccountUseCase.execute(request.user as ITokenDataInDTO);

			return new StatusOutDTO("deleted").toDict();

		}catch (error) {

			if (error instanceof UserNotFound) {

				return new StatusOutDTO("user_not_found").toDict();

			}

		}

	}



}
