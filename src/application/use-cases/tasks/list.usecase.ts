import { Inject, Injectable } from "@nestjs/common";
import { Task } from "src/domain/task/task.entity";
import { type ITaskRepository } from "src/application/repositories/task.repository";
import { InvalidToken as InvalidToken } from "src/application/erros/auth.errors";
import { TokenDataDTO } from "src/application/dtos/token.dto";
import { type IUserRepository } from "src/application/repositories/user.respotory";
import { TaskLimitExceeded } from "src/application/erros/task.error";
import { TaskSegment } from "src/domain/task/task-segment";

@Injectable()
export class ListTaskUseCase {

	constructor (
		@Inject("ITaskRepository") private readonly taskRepository: ITaskRepository,
		@Inject("IUserRepository") private readonly userRepository: IUserRepository
	) {}

	async execute(token: TokenDataDTO, limit: number, cursor?: string): Promise<TaskSegment> {

		// verify limit exceeded
		if (limit > 50 || limit < 0) throw new TaskLimitExceeded();

		const user = await this.userRepository.findById(token.sub);
		if (!user) throw new InvalidToken();

		return await this.taskRepository.getAllBySegment(user, limit, cursor);

	}

}
