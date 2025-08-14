import { Module } from '@nestjs/common';
import { AuthController } from '../../interfaces/http/v1/auth.controller';
import { RegisterUserUseCase } from '../../application/use-cases/auth/register.usecase';
import { LoginUseCase } from '../../application/use-cases/auth/login.usecase';
import { JWTImpl } from 'src/infrastructure/auth/jwt/jwt.repository.impl';
import { DatabaseModule } from './database.module';


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
