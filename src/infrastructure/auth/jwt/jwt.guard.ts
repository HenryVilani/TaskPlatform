import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Response } from "express";
import { StatusDTO } from "src/application/dtos/status.dto";
import { type IAuthRepository } from "src/application/repositories/auth.repository";

/**
 * Guard implementing JWT authentication.
 * Validates the JWT token from the Authorization header and attaches the payload to the request.
 */
@Injectable()
export class JWTGuard implements CanActivate {

	/**
	 * Constructs the JWTGuard with an authentication repository.
	 * @param {IAuthRepository} authRepository - Repository responsible for token validation and generation.
	 */
	constructor(
		@Inject("IAuthRepository") private readonly authRepository: IAuthRepository
	) {}

	/**
	 * Determines whether the current request is allowed to proceed.
	 * @param {ExecutionContext} context - The execution context of the current request.
	 * @returns {boolean} True if the token is valid, false otherwise.
	 * If authentication fails, responds with 401 and a StatusDTO message.
	 */
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const response = context.switchToHttp().getResponse<Response>();

		const token = request.headers["authorization"]?.split(" ")[1];
		if (!token) {
			response.status(401).json(new StatusDTO("unauthorized"));
			return false;
		}

		try {
			const payload = this.authRepository.validateToken(token);
			request.user = payload;
			return true;
		} catch (error) {
			response.status(401).json(new StatusDTO("invalid_token"));
			return false;
		}
	}
}