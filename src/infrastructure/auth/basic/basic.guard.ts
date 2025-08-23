import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { Response } from "express";
import { StatusDTO } from "src/application/dtos/status.dto";

/**
 * Guard implementing HTTP Basic Authentication.
 * Verifies the Authorization header against environment variables.
 */
@Injectable()
export class BasicGuard implements CanActivate {

	constructor() {}

	/**
	 * Determines whether the current request is allowed to proceed.
	 * @param {ExecutionContext} context - The execution context of the current request.
	 * @returns {boolean} True if authentication succeeds, false otherwise.
	 * If authentication fails, responds with 401 and a StatusDTO message.
	 */
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const response = context.switchToHttp().getResponse<Response>();

		const authHeader = request.headers["authorization"];
		if (!authHeader) {
			response.status(401).json(new StatusDTO("unauthorized"));
			return false;
		}

		try {
			const auth = authHeader.split(" ")[1];
			const correctAuth = Buffer.from(
				`${process.env.BASIC_USERNAME}:${process.env.BASIC_PASSWORD}`
			).toString("base64");

			return auth === correctAuth;
		} catch (error) {
			response.status(401).json(new StatusDTO("invalid_token"));
			return false;
		}
	}
}