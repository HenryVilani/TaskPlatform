import { Controller, Get, Logger } from "@nestjs/common";
import { StatusDTO } from "src/application/dtos/status.dto";
import { BaseError } from "src/application/erros/base.errors";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { HealthCheckUseCase } from "src/application/use-cases/server/health-check.use-case";
import { ServerHealthDTO } from "src/application/dtos/server.dto";

@Controller()
export class ServerController {

    constructor (
		private healthCheckUseCase: HealthCheckUseCase
	) {}

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

			const serverHealth = await this.healthCheckUseCase.execute();
			return new StatusDTO<ServerHealthDTO>("health", serverHealth);
			

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
