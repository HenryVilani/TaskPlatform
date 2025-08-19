import { Inject, Injectable } from "@nestjs/common";
import { isValid } from "ulid";
import { type ITaskRepository } from "src/application/repositories/task.repository";
import { InvalidId, InvalidToken } from "src/application/erros/auth.errors";
import { TokenDataDTO } from "src/application/dtos/token.dto";
import { TaskNotFound } from "src/application/erros/task.error";
import { type IUserRepository } from "src/application/repositories/user.respotory";

/**
 * Use case responsible for deleting a task of a user.
 */
@Injectable()
export class DeleteTaskUseCase {
	/**
	 * @param taskRepository Repository used to manage task data.
	 * @param userRepository Repository used to manage user data.
	 */
	constructor(
		@Inject("ITaskRepository") private readonly taskRepository: ITaskRepository,
		@Inject("IUserRepository") private readonly userRepository: IUserRepository
	) {}

	/**
	 * Executes the process of deleting a task.
	 * @param id The unique identifier of the task to delete.
	 * @param token Token data identifying the user who owns the task.
	 * @throws {InvalidId} Thrown if the task ID is not valid.
	 * @throws {InvalidToken} Thrown if the token does not correspond to a valid user.
	 * @throws {TaskNotFound} Thrown if the task does not exist.
	 * @returns A promise that resolves when the task has been deleted.
	 */
	async execute(id: string, token: TokenDataDTO): Promise<void> {
		if (!isValid(id)) throw new InvalidId();

		// get user from DB
		const user = await this.userRepository.findById(token.sub);
		if (!user) throw new InvalidToken();

		// get task from DB
		const task = await this.taskRepository.findById(user, id);
		if (!task) throw new TaskNotFound();

		this.taskRepository.delete(user, task);
	}
}
