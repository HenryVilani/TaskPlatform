import { Controller, Get, Logger } from "@nestjs/common";
import { StatusDTO } from "src/application/dtos/status.dto";
import { BaseError } from "src/application/erros/base.errors";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { HealthCheckUseCase } from "src/application/use-cases/server/health-check.use-case";
import { ServerHealthDTO } from "src/application/dtos/server.dto";

@Controller()
export class ServerController {

	constructor(
		private healthCheckUseCase: HealthCheckUseCase
	) {}

	/**
	 * GET /health
	 * Endpoint to check the server health status.
	 * Returns a health status DTO if successful.
	 */
	@Get("health")
	@ApiOperation({
		summary: "Health",
		description: "Get health server"
	})
	@ApiResponse({
		status: 200,
		description: "Return health status",
		type: StatusDTO
	})
	@ApiResponse({
		status: 400,
		description: "Error",
		type: StatusDTO<string>,
		examples: {
			"unknown_error": {
				summary: "Unknown error",
				value: new StatusDTO("unknown_error")
			},
		},
	})
	async serverHealthStatus() {
		try {
			// Execute health check use case to get server health information
			const serverHealth = await this.healthCheckUseCase.execute();

			// Return successful status with health information
			return new StatusDTO<ServerHealthDTO>("health", serverHealth);

		} catch (error) {
			// If the error is a known BaseError, return its id
			if (error instanceof BaseError) {
				return new StatusDTO(error.id);
			} else {
				// Log unknown errors and return generic unknown_error status
				Logger.log(error);
				return new StatusDTO("unknown_error");
			}
		}
	}

}
