import { Module } from '@nestjs/common';
import { AccoutController } from '../../interfaces/http/v1/account.controller';
import { DeleteAccountUseCase } from '../../application/use-cases/account/delete.usecase';
import { InfoAccountUseCase } from 'src/application/use-cases/account/info.usecase';
import { DatabaseModule } from './database.module';
import { AuthModule } from './auth.module';
import { ServerModule } from './server.module';

/**
 * AccountModule
 * 
 * This module handles all account-related operations including:
 * - Fetching account information (InfoAccountUseCase)
 * - Deleting accounts (DeleteAccountUseCase)
 * 
 * It integrates with:
 * - DatabaseModule for database access
 * - AuthModule for authentication and authorization
 * 
 * Controllers:
 * - AccoutController: Handles HTTP requests for account operations
 * 
 * Providers:
 * - DeleteAccountUseCase: Business logic for deleting accounts
 * - InfoAccountUseCase: Business logic for fetching account info
 * 
 * Exports:
 * - InfoAccountUseCase: Can be used by other modules if needed
 */
@Module({
	imports: [
		DatabaseModule,
		AuthModule,
		ServerModule
	],
	controllers: [AccoutController],
	providers: [
		DeleteAccountUseCase,
		InfoAccountUseCase
	],
	exports: [InfoAccountUseCase]
})
export class AccountModule {}
