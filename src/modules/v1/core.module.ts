import { Module } from '@nestjs/common';
import { HealthCheckService } from 'src/infrastructure/health/health-check.service';
import { ConnectionManager } from 'src/infrastructure/health/connection-manager';

/**
 * CoreModule
 * 
 * Base module that provides fundamental services.
 * Standard module without @Global decorator - services are accessed via lazy loading.
 * 
 * @export
 * @class CoreModule
 */
@Module({
	providers: [
		HealthCheckService,
		ConnectionManager
	],
	exports: [
		HealthCheckService, 
		ConnectionManager
	]
})
export class CoreModule {}