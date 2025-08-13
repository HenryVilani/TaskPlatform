import { Inject, Injectable } from "@nestjs/common";
import { ITokenDataInDTO } from "src/application/dtos/input/token.in.dto";
import { InvalidSession } from "src/application/erros/auth.errors";
import { type IUserRepository } from "src/application/repositories/user.respotory";
import { User } from "src/domain/user.domain";

@Injectable()
export class InfoAccountUseCase {

	constructor (
		@Inject("IUserRepository") private readonly userRepository: IUserRepository
	) {}

	async execute(token: ITokenDataInDTO): Promise<User> {

		const user = await this.userRepository.findById(token.sub);
		if (!user) throw new InvalidSession();

		return user;


	}

}
