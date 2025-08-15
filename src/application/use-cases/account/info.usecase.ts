import { Inject, Injectable } from "@nestjs/common";
import { TokenDataDTO } from "src/application/dtos/token.dto";
import { InvalidToken } from "src/application/erros/auth.errors";
import { type IUserRepository } from "src/application/repositories/user.respotory";
import { User } from "src/domain/user/user.entity";

@Injectable()
export class InfoAccountUseCase {

	constructor (
		@Inject("IUserRepository") private readonly userRepository: IUserRepository
	) {}

	async execute(token: TokenDataDTO): Promise<User> {

		const user = await this.userRepository.findById(token.sub);
		if (!user) throw new InvalidToken();

		return user;


	}

}
