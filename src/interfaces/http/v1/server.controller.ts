import { Controller, Get, Logger, OnModuleInit } from "@nestjs/common";
import { StatusDTO } from "src/application/dtos/status.dto";
import { BaseError } from "src/application/erros/base.errors";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { HealthCheckUseCase } from "src/application/use-cases/server/health-check.use-case";
import { ServerHealthDTO } from "src/application/dtos/server.dto";
import { LokiServiceImpl } from "src/infrastructure/observability/loki/loki.service.impl";
import { ILoggerRepository } from "src/application/services/logger.repository";
import { ConnectionManager } from "src/infrastructure/health/connection-manager";
import { NestLogServiceImpl } from "src/infrastructure/observability/nestLog/nestlog.service.impl";

@Controller()
export class ServerController implements OnModuleInit {

	private logger: ILoggerRepository | null = null;

	constructor(
		private healthCheckUseCase: HealthCheckUseCase,
		private connectionManager: ConnectionManager
	) {}

	async onModuleInit() {
		
		this.logger = await this.connectionManager.getConnection<ILoggerRepository>("log", async () => new NestLogServiceImpl())

	}

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
			this.logger?.register("Info", "SERVER_CONTROLLER", {
				action: "health_check_attempt",
				timestamp: new Date().toISOString()
			});

			// Execute health check use case to get server health information
			const serverHealth = await this.healthCheckUseCase.execute();

			this.logger?.register("Info", "SERVER_CONTROLLER", {
				action: "health_check_success",
				servicesHealthy: serverHealth.services.filter(s => s.status === "Health").length,
				servicesTotal: serverHealth.services.length,
				timestamp: new Date().toISOString()
			});

			// Return successful status with health information
			return new StatusDTO<ServerHealthDTO>("health", serverHealth);

		}catch (error) {
			this.logger?.register("Error", "SERVER_CONTROLLER", {
				action: "health_check_failed",
				error: error instanceof BaseError ? error.id : error.message,
				timestamp: new Date().toISOString()
			});

			// If the error is a known BaseError, return its id
			if (error instanceof BaseError) {
				return new StatusDTO(error.id);
			}else {
				// Return generic unknown_error status
				return new StatusDTO("unknown_error");
			}
		}
	}

}