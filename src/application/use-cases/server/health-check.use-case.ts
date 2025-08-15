import { Injectable } from "@nestjs/common";
import { DateTime } from "luxon";
import { ServerHealthDTO } from "src/application/dtos/server.dto";

@Injectable()
export class HealthCheckUseCase {

	constructor() {}

	async execute(): Promise<ServerHealthDTO> {

		return {

			timestamp: DateTime.now().toMillis(),
			uptime: process.uptime()

		}

	}

}
