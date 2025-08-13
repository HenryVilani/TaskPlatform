/**
 * Delete User UseCase Tests
 * 
 * - Refuse delete user with wrong email
 * - Refuse delete user with wrong token
 * - Delete user with correct token
 * 
 */

import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { Test, TestingModule } from "@nestjs/testing"
import { InvalidSession } from "src/application/erros/auth.errors";
import { DeleteAccountUseCase } from "src/application/use-cases/account/delete.usecase";
import { RegisterUserUseCase } from "src/application/use-cases/auth/register.usecase";
import { UserInMemoryRepository } from "src/infrastructure/database/inMemory/user.repository.impl";


describe('Delete User UseCase', () => {

	let registerUserUseCase: RegisterUserUseCase;
	let deleteAccountUseCase: DeleteAccountUseCase;

	beforeEach(async () => {

		let app: TestingModule = await Test.createTestingModule({
			controllers: [],
			providers: [
				DeleteAccountUseCase,
				{
					provide: "IUserRepository",
					useClass: UserInMemoryRepository
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

		deleteAccountUseCase = app.get<DeleteAccountUseCase>(DeleteAccountUseCase);
		registerUserUseCase = app.get<RegisterUserUseCase>(RegisterUserUseCase);

	});

	it("Refuse delete user with wrong token", async () => {

		const user = await registerUserUseCase.execute("user_03@gmail.com", "12345678");
		await expect(deleteAccountUseCase.execute({sub: "__WRONG__", email: user.email})).rejects.toThrow(InvalidSession);

	});

	it("Delete user with correct token", async () => {

		const user = await registerUserUseCase.execute("user_04@gmail.com", "12345678");
		await expect(deleteAccountUseCase.execute({sub: user.id, email: user.email})).resolves.toBeUndefined();

	});

})
