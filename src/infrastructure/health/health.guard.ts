import { CanActivate, ExecutionContext, Injectable, } from "@nestjs/common";
import { Response } from "express";
import { StatusDTO } from "src/application/dtos/status.dto";
import { HealthCheckService } from "./health-check.service";


@Injectable()
export class HealthCheckGuard implements CanActivate {

	constructor(
		private readonly healthCheckService: HealthCheckService
	) {}

	canActivate(context: ExecutionContext): boolean {

		const response = context.switchToHttp().getResponse<Response>();

		let hasUnHealth = this.healthCheckService.lastStatusAll().some(service => service.status == "UnHealth");

		if (hasUnHealth) {

			response.status(503).json(new StatusDTO("service_unavailable"));
			return false;

		}

		return true;

	}
	
}

