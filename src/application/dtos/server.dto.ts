import { HealthServiceStatus } from "../services/health-service.repository";

export class ServiceHealthDTO {

	name: string;
	status: HealthServiceStatus

}

/**
 * Data Transfer Object representing server health information.
 */
export class ServerHealthDTO {

	/**
   	 * Timestamp when the server health was checked.
   	 */
	timestamp: number;

	/**
   	 * Server uptime in seconds.
   	 */
	uptime: number;

	services: ServiceHealthDTO[];

}
