import { Inject, Injectable } from "@nestjs/common";
import { ulid } from "ulid";
import { Task, TaskName } from "src/domain/task.domain";
import { DateTime } from "luxon";
import { type ITaskRepository } from "src/application/repositories/task.repository";
import { ITokenDataInDTO } from "src/application/dtos/input/token.in.dto";
import { type IUserRepository } from "src/application/repositories/user.respotory";
import { InvalidToken } from "src/application/erros/auth.errors";
import type { ISchedulerRepository } from "src/application/services/scheduler.repository";
import { TaskCreateDTO } from "src/interfaces/http/v1/dtos/task.dto";

@Injectable()
export class CreateTaskUseCase {

	constructor (
		@Inject("ITaskRepository") private readonly taskRepository: ITaskRepository,
		@Inject("IUserRepository") private readonly userRepository: IUserRepository,
		@Inject("ISchedulerRepository") private readonly schedulerRepository: ISchedulerRepository
	) {}

	async execute(taskInfo: TaskCreateDTO, token: ITokenDataInDTO): Promise<Task> {

		const user = await this.userRepository.findById(token.sub);
		if (!user) throw new InvalidToken();

		const task = new Task(
			user, 
			ulid(), 
			await new TaskName(taskInfo.name).validate(), 
			taskInfo.content ?? "", 
			DateTime.now(), 
			DateTime.now(), 
			taskInfo.notifyAt ? DateTime.fromISO(taskInfo.notifyAt) : null,
			null,
			taskInfo.notifyType ?? null
		);

		await this.schedulerRepository.schedule(task);
		return await this.taskRepository.create(user, task);

	}

}
