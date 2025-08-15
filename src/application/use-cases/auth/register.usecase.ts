import { Inject, Injectable } from "@nestjs/common";
import { type IUserRepository } from "src/application/repositories/user.respotory";
import { UserAlreadyExists } from "src/application/erros/auth.errors";
import { Password } from "src/domain/user/password.value-object";
import { Email } from "src/domain/user/email.value-object";
import { User } from "src/domain/user/user.entity";
import { RegisterUserDTO } from "src/application/dtos/registerUser.dto";

@Injectable()
export class RegisterUserUseCase {

	constructor (
		@Inject("IUserRepository") private readonly userRepository: IUserRepository
	) {}

	async execute(email: string, password: string): Promise<RegisterUserDTO> {

		if (await this.userRepository.findByEmail(email)) {
			
			throw new UserAlreadyExists(email);
			
		}

		const passwordObj = await Password.create(password);
		const emailObj = Email.create(email);

		const user = new User(User.newId(), "User", emailObj, passwordObj);
		const registerdUser = await this.userRepository.create(user);

		return {
				
			id: registerdUser.id,
			email: registerdUser.email.value

		}
		

	}

}
