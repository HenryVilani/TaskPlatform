import { Module } from '@nestjs/common';
import { HealthCheckUseCase } from 'src/application/use-cases/server/health-check.use-case';
import { ServerController } from 'src/interfaces/http/v1/server.controller';
import { HealthCheckService } from 'src/infrastructure/health/health-check.service';
import { ConnectionManager } from 'src/infrastructure/health/connection-manager';

/**
 * ServerModule
 * 
 * This module handles server-related operations, such as health checks.
 * 
 * Features:
 * - Provides endpoints for server monitoring
 * - Integrates with other core modules for access to authentication, database, and account data
 * 
 * Controllers:
 * - ServerController: Handles HTTP requests related to server operations (e.g., health checks)
 * 
 * Providers:
 * - HealthCheckUseCase: Business logic to perform server health checks
 * 
 * Imports:
 * - DatabaseModule, AuthModule, AccountModule: Required for accessing user and account data if needed
 * 
 * Exports:
 * - None
 */
@Module({
	controllers: [ServerController],
	providers: [
		HealthCheckUseCase,
		HealthCheckService,
		ConnectionManager
	],
	exports: [HealthCheckService, ConnectionManager, HealthCheckUseCase]
})
export class ServerModule {}
