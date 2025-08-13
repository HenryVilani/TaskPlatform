import { Module } from '@nestjs/common';
import { AuthController } from '../../interfaces/http/v1/auth.controller';
import { RegisterUserUseCase } from '../../application/use-cases/auth/register.usecase';
import { UserSQLiteImpl } from '../../infrastructure/database/sqlite/user.repository.impl';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LoginUseCase } from '../../application/use-cases/auth/login.usecase';
import { JwtStrategy } from '../../infrastructure/auth/jwt.strategy';
import { AccoutController } from '../../interfaces/http/v1/account.controller';
import { UpdateTaskUseCase } from '../../application/use-cases/tasks/update.usecase';
import { CreateTaskUseCase } from '../../application/use-cases/tasks/create.usecase';
import { DeleteTaskUseCase } from '../../application/use-cases/tasks/delete.usecase';
import { ListTaskUseCase } from '../../application/use-cases/tasks/list.usecase';
import { DeleteAccountUseCase } from '../../application/use-cases/account/delete.usecase';
import { TaskController } from '../../interfaces/http/v1/task.controller';
import { TaskSQLiteImpl } from '../../infrastructure/database/sqlite/task.repository.impl';
import { AuthJWTImpl } from 'src/infrastructure/auth/jwtAuth/auth.repository.impl';
import { InfoAccountUseCase } from 'src/application/use-cases/account/info.usecase';

@Module({
	imports: [

		PassportModule,
		JwtModule.register({
			secret: process.env.JWT_SECRET ?? "secret",
			signOptions: {
				expiresIn: '1h'
			}
		})

	],
	controllers: [AuthController],
	providers: [
		{
			provide: "IUserRepository",
			useClass: UserSQLiteImpl
		},
		{
			provide: "IAuthRepository",
			useClass: AuthJWTImpl
		},
		JwtStrategy,

		RegisterUserUseCase, 
		LoginUseCase,
		
	]
})
export class AuthModule {}
