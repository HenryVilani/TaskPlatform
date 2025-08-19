import { Injectable } from "@nestjs/common";
import { DateTime } from "luxon";
import { ServerHealthDTO } from "src/application/dtos/server.dto";

/**
 * Use case responsible for performing a server health check.
 */
@Injectable()
export class HealthCheckUseCase {
	/**
	 * Initializes a new instance of HealthCheckUseCase.
	 */
	constructor() {}

	/**
	 * Executes the health check process.
	 * @returns A promise that resolves to a ServerHealthDTO containing the current timestamp and server uptime.
	 */
	async execute(): Promise<ServerHealthDTO> {
		return {
			timestamp: DateTime.now().toMillis(),
			uptime: process.uptime()
		};
	}
}
