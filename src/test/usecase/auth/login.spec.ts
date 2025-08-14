/**
 * Login User UseCase Tests
 * 
 * - Refuse login with wrong password
 * - Refuse login with wrong email
 * - Login with correct credentials
 * 
 */

import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { Test, TestingModule } from "@nestjs/testing"
import { WrongCredentials } from "src/application/erros/auth.errors";
import { LoginUseCase } from "src/application/use-cases/auth/login.usecase";
import { RegisterUserUseCase } from "src/application/use-cases/auth/register.usecase";
import { JWTImpl } from "src/infrastructure/auth/jwt/jwt.repository.impl";
import { UserInMemoryRepository } from "src/infrastructure/database/inMemory/user.repository.impl";


describe('Login User UseCase', () => {

	let loginUseCase: LoginUseCase;
	let registerUserUseCase: RegisterUserUseCase;

	beforeEach(async () => {

		let app: TestingModule = await Test.createTestingModule({
			controllers: [],
			providers: [
				LoginUseCase,
				{
					provide: "IUserRepository",
					useClass: UserInMemoryRepository
				},
				{
					provide: "IAuthRepository",
					useClass: JWTImpl
				},
				RegisterUserUseCase
			],
			imports: [

				PassportModule,
				JwtModule.register({
					secret: process.env.JWT_SECRET ?? "secret",
					signOptions: {expiresIn: '1h'}
				})

			]
		}).compile();

		loginUseCase = app.get<LoginUseCase>(LoginUseCase);
		registerUserUseCase = app.get<RegisterUserUseCase>(RegisterUserUseCase);

	});

	it("Refuse login with wrong password", async () => {

		await expect(loginUseCase.execute("test@gmail.com", "wrong_passowrd")).rejects.toThrow(WrongCredentials);

	});

	it("Refuse login with wrong email", async () => {

		await expect(loginUseCase.execute("wrong_email@gmail.com", "12345678")).rejects.toThrow(WrongCredentials);

	});

	it("Login with correct credentials", async () => {

		await registerUserUseCase.execute("user_01@gmail.com", "123456789");

		await expect(loginUseCase.execute("user_01@gmail.com", "123456789")).resolves.toHaveProperty("token");

	});

})
