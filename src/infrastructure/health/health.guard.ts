import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Response, Request } from "express";
import { StatusDTO } from "src/application/dtos/status.dto";
import { HealthCheckService } from "./health-check.service";

@Injectable()
export class HealthCheckGuard implements CanActivate {

	constructor(
		private readonly healthCheckService: HealthCheckService
	) {}

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
	 * Verifica se é rota de health (permite múltiplas variações)
	 */
	private isHealthRoute(url: string): boolean {
		const healthRoutes = ['/health', '/v1/health', '/api/health', '/status'];
		return healthRoutes.some(route => url.includes(route));
	}

	/**
	 * Schedule reconexões assíncronas sem bloquear a response
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