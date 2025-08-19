/**
 * Info Account UseCase Tests
 * 
 * Tests cover:
 * - Refuse to get info with invalid token
 * - Get user info with valid token
 */

import { Test, TestingModule } from "@nestjs/testing";
import { InvalidToken } from "src/application/erros/auth.errors";
import { InfoAccountUseCase } from "src/application/use-cases/account/info.usecase";
import { RegisterUserUseCase } from "src/application/use-cases/auth/register.usecase";
import { User } from "src/domain/user/user.entity";
import { UserInMemoryRepository } from "src/infrastructure/database/inMemory/user.repository.impl";

describe('Info Account UseCase', () => {

	let infoAccountUseCase: InfoAccountUseCase;
	let registerUserUseCase: RegisterUserUseCase;

	beforeEach(async () => {

		const app: TestingModule = await Test.createTestingModule({
			providers: [
				InfoAccountUseCase,
				RegisterUserUseCase,
				{
					provide: "IUserRepository",
					useClass: UserInMemoryRepository
				}
			]
		}).compile();

		infoAccountUseCase = app.get<InfoAccountUseCase>(InfoAccountUseCase);
		registerUserUseCase = app.get<RegisterUserUseCase>(RegisterUserUseCase);

	});

	it("should refuse to get info with invalid token", async () => {

		await expect(
			infoAccountUseCase.execute({ sub: "invalid_id", email: "test@example.com" })
		).rejects.toThrow(InvalidToken);

	});

	it("should get user info with valid token", async () => {

		const user = await registerUserUseCase.execute("user@example.com", "12345678");

		const result = await infoAccountUseCase.execute({
			sub: user.id,
			email: user.email
		});

		expect(result).toBeInstanceOf(User);
		expect(result.id).toBe(user.id);
		expect(result.email.value).toBe(user.email);

	});

});
