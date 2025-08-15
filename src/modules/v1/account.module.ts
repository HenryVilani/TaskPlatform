import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AccoutController } from '../../interfaces/http/v1/account.controller';
import { DeleteAccountUseCase } from '../../application/use-cases/account/delete.usecase';
import { InfoAccountUseCase } from 'src/application/use-cases/account/info.usecase';
import { DatabaseModule } from './database.module';
import { AuthModule } from './auth.module';

@Module({
	imports: [
		DatabaseModule,
		AuthModule
	],
	controllers: [AccoutController],
	providers: [
		DeleteAccountUseCase,
		InfoAccountUseCase
		
	],
	exports: [InfoAccountUseCase]
})
export class AccountModule {}
