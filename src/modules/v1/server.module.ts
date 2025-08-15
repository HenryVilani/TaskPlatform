import { Module } from '@nestjs/common';
import { InfoAccountUseCase } from 'src/application/use-cases/account/info.usecase';
import { DatabaseModule } from './database.module';
import { AuthModule } from './auth.module';
import { HealthCheckUseCase } from 'src/application/use-cases/server/health-check.use-case';
import { ServerController } from 'src/interfaces/http/v1/server.controller';
import { AccountModule } from './account.module';

@Module({
	imports: [
		DatabaseModule,
		AuthModule,
		AccountModule
	],
	controllers: [ServerController],
	providers: [
		HealthCheckUseCase
		
	],
	exports: []
})
export class ServerModule {}
