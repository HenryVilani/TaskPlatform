import { Injectable } from "@nestjs/common";
import { DateTime } from "luxon";
import { ServerHealthDTO } from "src/application/dtos/server.dto";
import { HealthCheckService } from "src/infrastructure/health/health-check.service";

/**
 * Use case responsible for performing a server health check.
 */
@Injectable()
export class HealthCheckUseCase {
	/**
	 * Initializes a new instance of HealthCheckUseCase.
	 */
	constructor(
		private readonly healthService: HealthCheckService
	) {}

	/**
	 * Executes the health check process.
	 * @returns A promise that resolves to a ServerHealthDTO containing the current timestamp and server uptime.
	 */
	async execute(): Promise<ServerHealthDTO> {

		let services = await this.healthService.checkAllServices();

		return {
			timestamp: DateTime.now().toMillis(),
			uptime: process.uptime(),
			services: services.map(service => {

				return {
					name: service.name,
					status: service.status
				}

			})
		};
	}
}
