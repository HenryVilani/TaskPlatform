import { Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { type Request } from "express";
import { DeleteAccountUseCase } from "src/application/use-cases/account/delete.usecase";
import { TokenDataDTO } from "../../../application/dtos/token.dto";
import { UserNotFound } from "src/application/erros/auth.errors";
import { StatusDTO } from "src/application/dtos/status.dto";
import { InfoAccountUseCase } from "src/application/use-cases/account/info.usecase";
import { IAccountInfoDTO } from "./dtos/account.dtos";
import { BaseError } from "src/application/erros/base.errors";
import { ApiExtraModels, ApiOperation, ApiResponse, getSchemaPath } from "@nestjs/swagger";
import { UserAuthDTO } from "./dtos/auth.dtos";
import { JWTGuard } from "src/infrastructure/auth/jwt/jwt.guard";
import { HealthCheckGuard } from "src/infrastructure/health/health.guard";

@ApiExtraModels(StatusDTO, UserAuthDTO)
@Controller("account")
export class AccoutController {

    constructor (
        private readonly deleteAccountUseCase: DeleteAccountUseCase,
        private readonly infoAccountUseCase: InfoAccountUseCase
    ) {}

    /**
     * Endpoint to fetch current user information.
     * Requires JWT authentication.
     */
    @UseGuards(JWTGuard)
	@UseGuards(HealthCheckGuard)
    @Get("me")
    @ApiOperation({ 
        summary: "Me",
        description: "Return information of current user"
    })
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
            // Execute use case to fetch user info
            const user = await this.infoAccountUseCase.execute(request.user as TokenDataDTO);
            
            // Return user info wrapped in StatusDTO
            return new StatusDTO<IAccountInfoDTO>("me", {
                id: user.id,
                email: user.email.value
            });

        } catch (error) {
            // Return appropriate error status
            if (error instanceof BaseError) {
                return new StatusDTO(error.id);
            } else {
                return new StatusDTO("unknown_error");
            }
        }
    }

    /**
     * Endpoint to delete the current user account.
     * Requires JWT authentication.
     */
    @UseGuards(JWTGuard)
    @Post("delete")
    @ApiOperation({ 
        summary: "Delete",
        description: "Delete current user"
    })
    @ApiResponse({ 
        status: 200,
        description: "User deleted successfully",
        example: {
            "status": "deleted"
        },
        schema: {
            allOf: [
                { $ref: getSchemaPath(StatusDTO) },
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
    async deleteAccount(@Req() request: Request) {
        try {
            // Execute use case to delete user
            await this.deleteAccountUseCase.execute(request.user as TokenDataDTO);

            // Return success status
            return new StatusDTO("deleted");

        } catch (error) {
            // Return specific error if user not found
            if (error instanceof UserNotFound) {
                return new StatusDTO("user_not_found");
            }
        }
    }
}
