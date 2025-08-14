import { Inject, Injectable } from "@nestjs/common";
import { ITokenDataInDTO } from "src/application/dtos/input/token.in.dto";
import { InvalidToken } from "src/application/erros/auth.errors";
import { type IUserRepository } from "src/application/repositories/user.respotory";

@Injectable()
export class DeleteAccountUseCase {

	constructor (
		@Inject("IUserRepository") private readonly userRepository: IUserRepository
	) {}

	async execute(token: ITokenDataInDTO): Promise<void> {

		const user = await this.userRepository.findById(token.sub);
		if (!user) throw new InvalidToken();

		await this.userRepository.delete(user);

	

	}

}
