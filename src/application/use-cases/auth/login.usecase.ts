import { Inject, Injectable } from "@nestjs/common";
import { type ILoginUserOutDTO } from "src/application/dtos/output/loginUser.out.dto";
import { WrongCredentials } from "src/application/erros/auth.errors";
import { type IAuthRepository } from "src/application/repositories/auth.repository";
import { type IUserRepository } from "src/application/repositories/user.respotory";
import { Email } from "src/domain/user.domain";

@Injectable()
export class LoginUseCase {

	constructor (
		@Inject("IUserRepository") private readonly userRepository: IUserRepository, 
		@Inject("IAuthRepository") private readonly authRepository: IAuthRepository,
	) {}

	async execute(email: string, password: string): Promise<ILoginUserOutDTO> {

		const validEmail = await new Email(email).validate();

		const user = await this.userRepository.findByEmail(validEmail.validatedEmail);
		if (!user) throw new WrongCredentials();

		if (await this.authRepository.authenticate(user, password)) {

			return {

				token: this.authRepository.getToken(user)

			}

		}

		throw new WrongCredentials();

	}

}
