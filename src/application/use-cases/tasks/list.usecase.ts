import { Inject, Injectable } from "@nestjs/common";
import { type ITaskRepository } from "src/application/repositories/task.repository";
import { InvalidToken } from "src/application/erros/auth.errors";
import { TokenDataDTO } from "src/application/dtos/token.dto";
import { type IUserRepository } from "src/application/repositories/user.respotory";
import { TaskLimitExceeded } from "src/application/erros/task.error";
import { TaskSegment } from "src/domain/task/task-segment";

/**
 * Use case responsible for listing tasks of a user with pagination support.
 */
@Injectable()
export class ListTaskUseCase {
	/**
	 * @param taskRepository Repository used to manage task data.
	 * @param userRepository Repository used to manage user data.
	 */
	constructor(
		@Inject("ITaskRepository") private readonly taskRepository: ITaskRepository,
		@Inject("IUserRepository") private readonly userRepository: IUserRepository
	) {}

	/**
	 * Executes the process of retrieving a segment of tasks for a user.
	 * @param token Token data identifying the user.
	 * @param limit Maximum number of tasks to return in this segment.
	 * @param cursor Optional cursor for pagination.
	 * @throws {TaskLimitExceeded} Thrown if the limit is greater than 50 or less than 0.
	 * @throws {InvalidToken} Thrown if the token does not correspond to a valid user.
	 * @returns A promise that resolves to a TaskSegment containing the tasks and pagination info.
	 */
	async execute(token: TokenDataDTO, limit: number, cursor?: string): Promise<TaskSegment> {
		// verify limit exceeded
		if (limit > 50 || limit < 0) throw new TaskLimitExceeded();

		const user = await this.userRepository.findById(token.sub);
		if (!user) throw new InvalidToken();

		return await this.taskRepository.getAllBySegment(user, limit, cursor);
	}
}
