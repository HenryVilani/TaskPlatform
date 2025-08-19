import { Inject, Injectable } from "@nestjs/common";
import { type IUserRepository } from "src/application/repositories/user.respotory";
import { UserAlreadyExists } from "src/application/erros/auth.errors";
import { Password } from "src/domain/user/password.value-object";
import { Email } from "src/domain/user/email.value-object";
import { User } from "src/domain/user/user.entity";
import { RegisterUserDTO } from "src/application/dtos/registerUser.dto";

/**
 * Use case responsible for registering a new user.
 */
@Injectable()
export class RegisterUserUseCase {
	/**
	 * @param userRepository Repository used to manage user data.
	 */
	constructor(
		@Inject("IUserRepository") private readonly userRepository: IUserRepository
	) {}

	/**
	 * Executes the user registration process.
	 * @param email The email address for the new user.
	 * @param password The password for the new user.
	 * @throws {UserAlreadyExists} Thrown if a user with the given email already exists.
	 * @returns A promise that resolves to a RegisterUserDTO containing the new user's ID and email.
	 */
	async execute(email: string, password: string): Promise<RegisterUserDTO> {
		if (await this.userRepository.findByEmail(email)) {
			throw new UserAlreadyExists(email);
		}

		const passwordObj = await Password.create(password);
		const emailObj = Email.create(email);

		const user = new User(User.newId(), "User", emailObj, passwordObj);
		const registeredUser = await this.userRepository.create(user);

		return {
			id: registeredUser.id,
			email: registeredUser.email.value
		};
	}
}
