import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { Response } from "express";
import { StatusDTO } from "src/application/dtos/status.dto";
import { type IAuthRepository } from "src/application/repositories/auth.repository";

@Injectable()
export class JWTGuard implements CanActivate {

	constructor(
		@Inject("IAuthRepository") private readonly authRepository: IAuthRepository 
	) {}

	canActivate(context: ExecutionContext): boolean {
		
		const request = context.switchToHttp().getRequest();
		const response = context.switchToHttp().getResponse<Response>();

		const token = request.headers["authorization"]?.split(" ")[1];

		if (!token) {

			response.status(401).json(new StatusDTO("unauthorized"))
			return false;

		}

		try {

			const payload = this.authRepository.validateToken(token);
			request.user = payload;
			
			return true;

		}catch(error) {

			response.status(401).json(new StatusDTO("invalid_token"))
			return false;

		}

	}


}

