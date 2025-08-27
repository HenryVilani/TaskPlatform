import { CallHandler, ExecutionContext, Inject, Injectable, Logger, NestInterceptor, OnModuleInit } from "@nestjs/common";
import { Request } from "express";
import { DateTime } from "luxon";
import { Observable } from "rxjs";
import { tap} from "rxjs/operators"
import { TokenDataDTO } from "src/application/dtos/token.dto";
import { type ILoggerRepository } from "src/application/services/logger.repository";
import { NestLogServiceImpl } from "../observability/nestLog/nestlog.service.impl";
import { ConnectionManager } from "../health/connection-manager";

/**
 * Interceptor that logs HTTP requests and responses.
 * Captures request details, response times, and user information for monitoring.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor, OnModuleInit {

	private logger: ILoggerRepository | null = null;

	/**
	 * Constructor for LoggingInterceptor.
	 * @param {ILoggerRepository} loggerService - Service for structured logging
	 */
	constructor(
		private readonly connectionManager: ConnectionManager
	) {}

	async onModuleInit() {
		
		this.logger = await this.connectionManager.getConnection<ILoggerRepository>("log", async () => new NestLogServiceImpl())

	}

	/**
	 * Intercepts HTTP requests to log request and response information.
	 * @param {ExecutionContext} context - The execution context
	 * @param {CallHandler<any>} next - The next handler in the chain
	 * @returns {Observable<any> | Promise<Observable<any>>} Observable of the response
	 */
	intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
	
		const request = context.switchToHttp().getRequest<Request>();
		const { method, url } = request;
		const useAgent = request.get("User-Agent") || '';
		const ip = request.ip;
		const userId = (request.user as TokenDataDTO)?.sub ?? "anonymous";
		const now = DateTime.now();

		return next.handle().pipe(
			tap({
				next: () => {
					
					const responseTime = DateTime.now().diff(now);
					this.logger?.register("Info", "REQUEST", {
						method,
						url,
						responseTime,
						useAgent,
						ip,
						userId
					})

				},
				error: (error) => {

					const responseTime = DateTime.now().diff(now);
					this.logger?.register("Error", "REQUEST", {
						method,
						url,
						responseTime,
						useAgent,
						ip,
						userId
					})

				}
			})
		)
		
	}

}