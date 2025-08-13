import { Inject, Injectable } from "@nestjs/common";
import { ulid, isValid } from "ulid";
import { Task, TaskName } from "src/domain/task.domain";
import { DateTime } from "luxon";
import { type ITaskRepository } from "src/application/repositories/task.repository";
import { InvalidId, UserNotFound, InvalidSession } from "src/application/erros/auth.errors";
import { ITokenDataInDTO } from "src/application/dtos/input/token.in.dto";
import { type IUserRepository } from "src/application/repositories/user.respotory";
import { IInTaskControllerDTO } from "src/interfaces/http/v1/dtos/task.dto";

@Injectable()
export class ListTaskUseCase {

	constructor (
		@Inject("ITaskRepository") private readonly taskRepository: ITaskRepository,
		@Inject("IUserRepository") private readonly userRepository: IUserRepository
	) {}

	async execute(token: ITokenDataInDTO): Promise<Task[]> {

		const user = await this.userRepository.findById(token.sub);
		if (!user) throw new InvalidSession();

		return await this.taskRepository.findTasksByUser(user);

	}

}
