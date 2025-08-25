import { Module } from '@nestjs/common';
import { HealthCheckUseCase } from 'src/application/use-cases/server/health-check.use-case';
import { ServerController } from 'src/interfaces/http/v1/server.controller';
import { CoreModule } from './core.module';

/**
 * ServerModule
 * 
 * Still imports CoreModule normally since it doesn't create circular dependencies.
 * 
 * @export
 * @class ServerModule
 */
@Module({
	imports: [
		CoreModule
	],
	controllers: [
		ServerController
	],
	providers: [
		HealthCheckUseCase,
	],
	exports: [
		HealthCheckUseCase
	]
})
export class ServerModule {}