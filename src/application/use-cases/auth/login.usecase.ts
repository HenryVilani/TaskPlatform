import { Inject, Injectable } from "@nestjs/common";
import { type LoginUserDTO } from "src/application/dtos/loginUser.dto";
import { WrongCredentials } from "src/application/erros/auth.errors";
import { type IAuthRepository } from "src/application/repositories/auth.repository";
import { type IUserRepository } from "src/application/repositories/user.respotory";
import { Email } from "src/domain/user/email.value-object";

/**
 * Use case responsible for authenticating a user and returning a login token.
 */
@Injectable()
export class LoginUseCase {
	/**
	 * @param userRepository Repository used to manage user data.
	 * @param authRepository Repository used for authentication and token generation.
	 */
	constructor(
		@Inject("IUserRepository") private readonly userRepository: IUserRepository,
		@Inject("IAuthRepository") private readonly authRepository: IAuthRepository,
	) {}

	/**
	 * Executes the login process for a user.
	 * @param email The email address of the user attempting to log in.
	 * @param password The password provided by the user.
	 * @throws {WrongCredentials} Thrown if the email or password is invalid.
	 * @returns A promise that resolves to a LoginUserDTO containing the authentication token.
	 */
	async execute(email: string, password: string): Promise<LoginUserDTO> {
		const validEmail = Email.create(email);

		const user = await this.userRepository.findByEmail(validEmail.value);
		if (!user) throw new WrongCredentials();

		if (await this.authRepository.authenticate(user, password)) {
			return {
				token: this.authRepository.getToken(user)
			};
		}

		throw new WrongCredentials();
	}
}
