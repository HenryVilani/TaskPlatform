import { Inject, Injectable, Logger } from "@nestjs/common";
import { IRegisterUserOutDTO } from "src/application/dtos/output/registerUser.out.dto";
import { type IUserRepository } from "src/application/repositories/user.respotory";
import { Email, Password, User } from "src/domain/user.domain";
import { ulid } from "ulid";
import argon2 from "argon2"
import { PasswordIsNotValid, UserAlreadyExists } from "src/application/erros/auth.errors";

@Injectable()
export class RegisterUserUseCase {

	constructor (
		@Inject("IUserRepository") private readonly userRepository: IUserRepository
	) {}

	async execute(email: string, password: string): Promise<IRegisterUserOutDTO> {

		if (await this.userRepository.findByEmail(email)) {
			
			throw new UserAlreadyExists(email);
			
		}

		const passwordObj = await new Password(password).validate();
		const emailObj = await new Email(email).validate();

		const user = new User(ulid(), emailObj, passwordObj);
		const registerdUser = await this.userRepository.create(user);

		return {
				
			id: registerdUser.id,
			email: registerdUser.email.validatedEmail

		}
		

	}

}
