import { Inject, Injectable, Logger } from "@nestjs/common";
import { ulid, isValid } from "ulid";
import { Task, TaskName } from "src/domain/task.domain";
import { DateTime } from "luxon";
import { type ITaskRepository } from "src/application/repositories/task.repository";
import { InvalidId, InvalidSession } from "src/application/erros/auth.errors";
import { ITokenDataInDTO } from "src/application/dtos/input/token.in.dto";
import { type IUserRepository } from "src/application/repositories/user.respotory";
import { IInTaskControllerDTO } from "src/interfaces/http/v1/dtos/task.dto";
import { TaskNotFound } from "src/application/erros/task.error";

@Injectable()
export class UpdateTaskUseCase {

	constructor (
		@Inject("ITaskRepository") private readonly taskRepository: ITaskRepository,
		@Inject("IUserRepository") private readonly userRepository: IUserRepository
	) {}

	async execute(taskData: IInTaskControllerDTO, token: ITokenDataInDTO): Promise<Task> {

		if (!isValid(taskData.id)) throw new InvalidId();

		const user = await this.userRepository.findById(token.sub);
		if (!user) throw new InvalidSession();

		const task = await this.taskRepository.findTaskById(user, taskData.id);
		if (!task) throw new TaskNotFound();
	

		const updatedTask = new Task(
			user,
			taskData.id, 
			await new TaskName(taskData.name).validate(), 
			taskData.content, 
			task.createdAt, 
			DateTime.now(), 
			taskData.notifyAt ? DateTime.fromISO(taskData.notifyAt) : null
		);

		
		return await this.taskRepository.update(user, updatedTask)

	}

}
