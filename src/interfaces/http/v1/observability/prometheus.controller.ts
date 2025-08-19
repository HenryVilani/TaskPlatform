import { Controller, Get, Res, UseGuards } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { type Response } from "express";
import { BasicGuard } from "src/infrastructure/auth/basic/basic.guard";
import { PrometheusService } from "src/infrastructure/observability/prometheus/prometheus.service";

/**
 * Controller for exposing Prometheus metrics endpoint.
 * This endpoint is excluded from Swagger documentation.
 */
@Controller('metrics')
@ApiExcludeController()
export class PrometheusController {

	// Inject PrometheusService to fetch metrics
	constructor(private readonly prometheusService: PrometheusService) {}

	/**
	 * GET /metrics
	 * Returns all Prometheus metrics in text format.
	 * Protected by basic authentication via BasicGuard.
	 */
	@Get()
	@UseGuards(BasicGuard)
	async getMetrics(@Res() res: Response) {

		// Retrieve metrics from PrometheusService
		const metrics = await this.prometheusService.getMetrics();

		// Set proper content type for Prometheus scraping
		res.setHeader('Content-Type', 'text/plain');

		// Send metrics to the client
		res.send(metrics);

	}
}
