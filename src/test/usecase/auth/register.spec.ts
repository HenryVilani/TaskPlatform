/**
 * Register User UseCase Tests
 * 
 * - Reject register with weakness password
 * - Register new user
 * - Check if already exist user
 * - Check if the password is strong
 * 
 */

import { Test, TestingModule } from "@nestjs/testing"
import { PasswordIsNotValid, UserAlreadyExists } from "src/application/erros/auth.errors";
import { RegisterUserUseCase } from "src/application/use-cases/auth/register.usecase";
import { UserInMemoryRepository } from "src/infrastructure/database/inMemory/user.repository.impl";


describe('Register User UseCase', () => {

	let registerUserUseCase: RegisterUserUseCase;

	beforeEach(async () => {

		let app: TestingModule = await Test.createTestingModule({
			controllers: [],
			providers: [
				RegisterUserUseCase,
				{
					provide: "IUserRepository",
					useClass: UserInMemoryRepository
				}
			],
			imports: []
		}).compile();

		registerUserUseCase = app.get<RegisterUserUseCase>(RegisterUserUseCase);

	});

	it('Reject register with weakness password', async () => {

		await expect(registerUserUseCase.execute("test@gmail.com", "123")).rejects.toThrow(PasswordIsNotValid);

	});

	it('Register new user', async () => {

		await expect(registerUserUseCase.execute("test@gmail.com", "123456789")).resolves.toHaveProperty("email");

	});

	it('Check if already exist user', async () => {
		
		await expect(registerUserUseCase.execute("test@gmail.com", "12345678")).rejects.toThrow(UserAlreadyExists);
		
	});


})
