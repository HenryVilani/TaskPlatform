import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from 'src/infrastructure/interceptors/logging.interceptor';
import { LokiBaseServiceImpl } from 'src/infrastructure/observability/loki/loki.health';
import { LokiServiceImpl } from 'src/infrastructure/observability/loki/loki.service.impl';
import { PrometheusExceptionFilter, PrometheusService } from 'src/infrastructure/observability/prometheus/prometheus.service';
import { PrometheusController } from 'src/interfaces/http/v1/observability/prometheus.controller';
import { ServerModule } from './server.module';

/**
 * ObservabilityModule
 * 
 * This module provides observability features for the application,
 * including logging, metrics collection, and exception tracking.
 * 
 * Features:
 * - Loki logging implementation (LokiServiceImpl)
 * - Prometheus metrics service and exception filter
 * - Global logging interceptor for request logging
 * 
 * Providers:
 * - ILoggerRepository (LokiServiceImpl): Repository for logging to Loki
 * - PrometheusExceptionFilter: Captures exceptions and reports metrics to Prometheus
 * - LoggingInterceptor: Intercepts requests for logging purposes
 * - PrometheusService: Provides Prometheus metrics functionality
 * 
 * Controllers:
 * - PrometheusController: Exposes HTTP endpoints for Prometheus metrics
 * 
 * Exports:
 * - ILoggerRepository: Can be used by other modules to log events
 */
@Module({
	imports: [ServerModule],
	providers: [
		{
			provide: "ILoggerRepository",
			useClass: LokiServiceImpl
		},
		{
			provide: APP_FILTER,
			useClass: PrometheusExceptionFilter
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: LoggingInterceptor
		},
		PrometheusService,
		LokiBaseServiceImpl,
	],
	controllers: [PrometheusController],
	exports: ["ILoggerRepository", LokiBaseServiceImpl],
})
export class ObservabilityModule {}
