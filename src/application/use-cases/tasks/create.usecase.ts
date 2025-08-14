import { Inject, Injectable } from "@nestjs/common";
import { ulid } from "ulid";
import { Task, TaskName } from "src/domain/task.domain";
import { DateTime } from "luxon";
import { type ITaskRepository } from "src/application/repositories/task.repository";
import { ITokenDataInDTO } from "src/application/dtos/input/token.in.dto";
import { type IUserRepository } from "src/application/repositories/user.respotory";
import { InvalidToken } from "src/application/erros/auth.errors";

@Injectable()
export class CreateTaskUseCase {

	constructor (
		@Inject("ITaskRepository") private readonly taskRepository: ITaskRepository,
		@Inject("IUserRepository") private readonly userRepository: IUserRepository
	) {}

	async execute(name: string, token: ITokenDataInDTO): Promise<Task> {

		const user = await this.userRepository.findById(token.sub);
		if (!user) throw new InvalidToken();

		const task = new Task(user, ulid(), await new TaskName(name).validate(), "", DateTime.now(), DateTime.now(), null);
		return await this.taskRepository.create(user, task);

	}

}
