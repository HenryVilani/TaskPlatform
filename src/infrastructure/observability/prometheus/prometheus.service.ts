import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { Request, Response } from "express";
import * as client from "prom-client"
import { HttpErrorCounter } from "./prometheus-metrics.service";
import { type ILoggerRepository } from "src/application/services/logger.repository";


/**
 * Service to manage Prometheus metrics collection.
 * Registers default Node.js metrics and provides access to the metrics endpoint.
 */
@Injectable()
export class PrometheusService {

	private readonly register: client.Registry;

	constructor() {
		// Create a new Prometheus registry
		this.register = new client.Registry();

		// Set default labels to identify the application
		this.register.setDefaultLabels({ app: 'backend-prometheus' });

		// Collect default Node.js metrics (CPU, memory, event loop, etc.)
		client.collectDefaultMetrics({ register: this.register });
	}

	/**
	 * Returns all metrics in Prometheus exposition format.
	 */
	getMetrics(): Promise<string> {
		return this.register.metrics();
	}
}



/**
 * Exception filter that increments Prometheus HTTP error counters
 * and logs errors using the application's logger repository.
 */
@Injectable()
@Catch()
export class PrometheusExceptionFilter implements ExceptionFilter {

	constructor(
		@Inject("ILoggerRepository") private readonly loggerService: ILoggerRepository
	) {}

	catch(exception: unknown, host: ArgumentsHost) {

		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		// Determine HTTP status code
		const status = exception instanceof HttpException
			? exception.getStatus()
			: HttpStatus.INTERNAL_SERVER_ERROR;

		// Increment Prometheus counter for HTTP errors with labels
		HttpErrorCounter.inc({
			status: status.toString(),
			method: request.method,
			path: request.url
		});

		// Log the exception using the logger service
		if (exception instanceof Error) {
			this.loggerService.register("Error", exception.message, {
				status: status.toString(),
				method: request.method,
				url: request.url
			});
		} else {
			// For unknown error types, log a generic message
			this.loggerService.register("Error", "UNKNOWN ERROR", {
				status: status.toString(),
				method: request.method,
				url: request.url
			});
		}

		// Return standard JSON response to the client
		response.status(status).json({
			statusCode: status,
			message:
				exception instanceof HttpException
					? exception.getResponse()
					: 'Internal server error',
		});
	}
}
