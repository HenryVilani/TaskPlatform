import { Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { type Request } from "express";
import { DeleteAccountUseCase } from "src/application/use-cases/account/delete.usecase";
import { ITokenDataInDTO } from "../../../application/dtos/input/token.in.dto";
import { UserNotFound } from "src/application/erros/auth.errors";
import { StatusDTO } from "src/application/dtos/output/status.out.dto";
import { InfoAccountUseCase } from "src/application/use-cases/account/info.usecase";
import { IAccountOutDTO } from "./dtos/account.dtos";
import { BaseError } from "src/application/erros/base.errors";
import { ApiExtraModels, ApiOperation, ApiResponse, getSchemaPath } from "@nestjs/swagger";
import { UserAuthDTO } from "./dtos/auth.dtos";
import { JWTGuard } from "src/infrastructure/auth/jwt/jwt.guard";

@ApiExtraModels(StatusDTO, UserAuthDTO)
@Controller("account")
export class AccoutController {

    constructor (
		private readonly deleteAccountUseCase: DeleteAccountUseCase,
		private readonly infoAccountUseCase: InfoAccountUseCase
	) {}

	@UseGuards(JWTGuard)
    @Get("me")
	@ApiOperation({ summary: "Me" })
	@ApiResponse({ 
		status: 200,
		description: "Return me information",
		
		schema: {
			allOf: [
				{ $ref: getSchemaPath(StatusDTO) },
				{
					properties: {
						data: { $ref: getSchemaPath(UserAuthDTO) }
					}
				}
			]
		}
	})
	@ApiResponse({ 
		status: 400, 
		description: "Error", 
		type: StatusDTO<string>, 
		examples: {
			"invalid_token": {
				summary: "Invalid Session",
				value: new StatusDTO("invalid_token") 
			},
			"unknown_error": {
				summary: "Unknown error",
				value: new StatusDTO("unknown_error") 
			},
			
		},

	})
	@ApiResponse({
		status: 401,
		description: "Unauthorized",
		example: new StatusDTO("unauthorized"),
		type: StatusDTO
	})
    async meAccount(@Req() request: Request) {

		try {

			const user = await this.infoAccountUseCase.execute(request.user as ITokenDataInDTO);
			
			return new StatusDTO<IAccountOutDTO>("me", {
				id: user.id,
				email: user.email.validatedEmail
			});

		}catch (error) {

			if (error instanceof BaseError) {

				return new StatusDTO(error.id);

			}else {

				return new StatusDTO("unknown_error");

			}

		}

    }

	@UseGuards(JWTGuard)
	@Post("delete")
	async deleteAccount(@Req() request: Request) {

		try {

			await this.deleteAccountUseCase.execute(request.user as ITokenDataInDTO);

			return new StatusDTO("deleted");

		}catch (error) {

			if (error instanceof UserNotFound) {

				return new StatusDTO("user_not_found");

			}

		}

	}



}
