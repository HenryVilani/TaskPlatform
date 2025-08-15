import { Inject, Injectable } from "@nestjs/common";
import { isValid } from "ulid";
import { type ITaskRepository } from "src/application/repositories/task.repository";
import { InvalidId, InvalidToken } from "src/application/erros/auth.errors";
import { TokenDataDTO } from "src/application/dtos/token.dto";
import { TaskNotFound } from "src/application/erros/task.error";
import { type IUserRepository } from "src/application/repositories/user.respotory";

@Injectable()
export class DeleteTaskUseCase {

	constructor (
		@Inject("ITaskRepository") private readonly taskRepository: ITaskRepository,
		@Inject("IUserRepository") private readonly userRepository: IUserRepository
	) {}

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
