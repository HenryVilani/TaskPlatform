import { Inject, Injectable } from "@nestjs/common";
import { TokenDataDTO } from "src/application/dtos/token.dto";
import { InvalidToken } from "src/application/erros/auth.errors";
import { type IUserRepository } from "src/application/repositories/user.respotory";

/**
 * Use case responsible for deleting a user's account.
 */
@Injectable()
export class DeleteAccountUseCase {
	/**
	 * @param userRepository Repository used to manage user data.
	 */
	constructor(
		@Inject("IUserRepository") private readonly userRepository: IUserRepository
	) {}

	/**
	 * Executes the account deletion process.
	 * @param token Token data containing the user ID to identify the account.
	 * @throws {InvalidToken} Thrown if the token does not correspond to a valid user.
	 * @returns A promise that resolves when the user's account has been deleted.
	 */
	async execute(token: TokenDataDTO): Promise<void> {
		const user = await this.userRepository.findById(token.sub);
		if (!user) throw new InvalidToken();

		await this.userRepository.delete(user);
	}
}
