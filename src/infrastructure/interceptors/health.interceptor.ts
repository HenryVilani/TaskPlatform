import { CallHandler, ExecutionContext, Inject, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Request, Response } from "express";
import { Observable } from "rxjs";
import { StatusDTO } from "src/application/dtos/status.dto";
import { HealthCheckService } from "../health/health-check.service";


@Injectable()
export class HealthInterceptor implements NestInterceptor {

	constructor(
		private readonly healthCheckService: HealthCheckService
	) {}

	intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
	
		const request = context.switchToHttp().getRequest<Request>();
		const response = context.switchToHttp().getResponse<Response>();

		let hasUnHealth = this.healthCheckService.lastStatusAll().some(service => service.status == "UnHealth");

		if (hasUnHealth) {

			response.status(503).json(new StatusDTO("service_unavailable"))

		}


		return next.handle();

	}



}
