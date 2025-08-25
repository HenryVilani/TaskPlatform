import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from 'src/infrastructure/interceptors/logging.interceptor';
import { LokiBaseServiceImpl } from 'src/infrastructure/observability/loki/loki.health';
import { LokiServiceImpl } from 'src/infrastructure/observability/loki/loki.service.impl';
import { PrometheusExceptionFilter, PrometheusService } from 'src/infrastructure/observability/prometheus/prometheus.service';
import { PrometheusController } from 'src/interfaces/http/v1/observability/prometheus.controller';
import { CoreModule } from './core.module';

/**
 * ObservabilityModule with Lazy Loading
 * 
 * No longer needs to import CoreModule directly.
 * LokiBaseServiceImpl will lazy load required services to avoid circular dependencies.
 * 
 * @export
 * @class ObservabilityModule
 */
@Module({
	imports: [
		CoreModule
	],
	providers: [
		/**
		 * ILoggerRepository Provider
		 */
		{
			provide: "ILoggerRepository",
			useClass: LokiServiceImpl
		},

		/**
		 * Global Exception Filter
		 */
		{
			provide: APP_FILTER,
			useClass: PrometheusExceptionFilter
		},

		/**
		 * Global Logging Interceptor
		 */
		{
			provide: APP_INTERCEPTOR,
			useClass: LoggingInterceptor
		},

		/**
		 * PrometheusService
		 */
		PrometheusService,

		/**
		 * LokiServiceImpl - Main logging service
		 */
		LokiServiceImpl,

		/**
		 * LokiBaseServiceImpl - Health service with lazy loading
		 * Will lazy load HealthCheckService and ConnectionManager
		 */
		LokiBaseServiceImpl,
	],
	controllers: [
		PrometheusController
	],
	exports: [
		"ILoggerRepository",
		LokiBaseServiceImpl
	],
})
export class ObservabilityModule {}