import { Inject, Injectable } from "@nestjs/common";
import { TokenDataDTO } from "src/application/dtos/token.dto";
import { InvalidToken } from "src/application/erros/auth.errors";
import { type IUserRepository } from "src/application/repositories/user.respotory";

@Injectable()
export class DeleteAccountUseCase {

	constructor (
		@Inject("IUserRepository") private readonly userRepository: IUserRepository
	) {}

	async execute(token: TokenDataDTO): Promise<void> {

		const user = await this.userRepository.findById(token.sub);
		if (!user) throw new InvalidToken();

		await this.userRepository.delete(user);

	

	}

}
