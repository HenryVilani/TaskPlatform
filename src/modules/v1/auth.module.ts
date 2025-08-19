import { Module } from '@nestjs/common';
import { AuthController } from '../../interfaces/http/v1/auth.controller';
import { RegisterUserUseCase } from '../../application/use-cases/auth/register.usecase';
import { LoginUseCase } from '../../application/use-cases/auth/login.usecase';
import { JWTImpl } from 'src/infrastructure/auth/jwt/jwt.repository.impl';
import { DatabaseModule } from './database.module';

/**
 * AuthModule
 * 
 * This module handles all authentication-related operations including:
 * - User registration (RegisterUserUseCase)
 * - User login (LoginUseCase)
 * 
 * It integrates with:
 * - DatabaseModule for database access
 * 
 * Controllers:
 * - AuthController: Handles HTTP requests for authentication endpoints
 * 
 * Providers:
 * - IAuthRepository (JWTImpl): Repository implementation for JWT operations
 * - RegisterUserUseCase: Business logic for registering users
 * - LoginUseCase: Business logic for logging in users
 * 
 * Exports:
 * - IAuthRepository: Can be used by other modules for authentication purposes
 */
@Module({
	imports: [DatabaseModule],
	controllers: [AuthController],
	providers: [
		{
			provide: "IAuthRepository",
			useClass: JWTImpl
		},
		RegisterUserUseCase,
		LoginUseCase,
	],
	exports: ["IAuthRepository"]
})
export class AuthModule {}
