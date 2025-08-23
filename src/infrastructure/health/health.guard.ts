import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Response, Request } from "express";
import { StatusDTO } from "src/application/dtos/status.dto";
import { HealthCheckService } from "./health-check.service";

/**
 * Guard that checks application health before allowing requests to proceed.
 * Blocks requests when critical services are unhealthy.
 */
@Injectable()
export class HealthCheckGuard implements CanActivate {

	/**
	 * Constructor for HealthCheckGuard.
	 * @param {HealthCheckService} healthCheckService - Service for checking application health
	 */
	constructor(
		private readonly healthCheckService: HealthCheckService
	) {}

	/**
	 * Determines if the current request can proceed based on system health.
	 * @param {ExecutionContext} context - The execution context of the current request
	 * @returns {boolean} True if system is healthy or request is for health endpoint, false otherwise
	 */
	canActivate(context: ExecutionContext): boolean {
		const response = context.switchToHttp().getResponse<Response>();
		const request = context.switchToHttp().getRequest<Request>();

		// SEMPRE permite rota health para monitoramento
		if (this.isHealthRoute(request.url)) {
			return true;
		}

		// Check rápido em cache (não bloqueia)
		const cachedServices = this.healthCheckService.getCachedStatus();
		const hasUnhealthyServices = cachedServices.some(service => service.status === "UnHealth");

		if (hasUnhealthyServices) {
			// Trigger async reconnection para serviços unhealthy (não bloqueia)
			this.scheduleReconnectionsAsync(cachedServices);

			// Block request imediatamente
			response.status(503).json(new StatusDTO("service_unavailable"));
			return false;
		}

		return true;
	}

	/**
	 * Checks if the current request is for a health monitoring endpoint.
	 * @private
	 * @param {string} url - The request URL
	 * @returns {boolean} True if it's a health route, false otherwise
	 */
	private isHealthRoute(url: string): boolean {
		const healthRoutes = ['/health', '/v1/health', '/api/health', '/status'];
		return healthRoutes.some(route => url.includes(route));
	}

	/**
	 * Schedules asynchronous reconnections for unhealthy services without blocking the response.
	 * @private
	 * @param {any[]} services - Array of service health information
	 */
	private scheduleReconnectionsAsync(services: any[]): void {
		// Fire and forget - não await
		setImmediate(() => {
			services
				.filter(service => service.status === "UnHealth")
				.forEach(service => {
					this.healthCheckService.scheduleReconnection(service.name);
				});
		});
	}
}