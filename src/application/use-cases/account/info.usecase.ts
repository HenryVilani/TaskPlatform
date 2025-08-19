import { Inject, Injectable } from "@nestjs/common";
import { TokenDataDTO } from "src/application/dtos/token.dto";
import { InvalidToken } from "src/application/erros/auth.errors";
import { type IUserRepository } from "src/application/repositories/user.respotory";
import { User } from "src/domain/user/user.entity";

/**
 * Use case responsible for retrieving information about a user's account.
 */
@Injectable()
export class InfoAccountUseCase {
	/**
	 * @param userRepository Repository used to manage user data.
	 */
	constructor(
		@Inject("IUserRepository") private readonly userRepository: IUserRepository
	) {}

	/**
	 * Executes the process to get user account information.
	 * @param token Token data containing the user ID.
	 * @throws {InvalidToken} Thrown if the token does not correspond to a valid user.
	 * @returns A promise that resolves to the User entity.
	 */
	async execute(token: TokenDataDTO): Promise<User> {
		const user = await this.userRepository.findById(token.sub);
		if (!user) throw new InvalidToken();

		return user;
	}
}
