import { Inject, Injectable } from "@nestjs/common";
import { Task } from "src/domain/task/task.entity";
import { DateTime } from "luxon";
import { type ITaskRepository } from "src/application/repositories/task.repository";
import { TokenDataDTO } from "src/application/dtos/token.dto";
import { type IUserRepository } from "src/application/repositories/user.respotory";
import { InvalidToken } from "src/application/erros/auth.errors";
import type { ISchedulerRepository } from "src/application/services/scheduler.repository";
import { TaskCreateDTO } from "src/interfaces/http/v1/dtos/task.dto";
import { TaskName } from "src/domain/task/task-name.value-object";

/**
 * Use case responsible for creating a new task for a user.
 */
@Injectable()
export class CreateTaskUseCase {
	/**
	 * @param taskRepository Repository used to manage task data.
	 * @param userRepository Repository used to manage user data.
	 * @param schedulerRepository Repository used to schedule task notifications.
	 */
	constructor(
		@Inject("ITaskRepository") private readonly taskRepository: ITaskRepository,
		@Inject("IUserRepository") private readonly userRepository: IUserRepository,
		@Inject("ISchedulerRepository") private readonly schedulerRepository: ISchedulerRepository
	) {}

	/**
	 * Executes the process of creating a new task.
	 * @param taskInfo Data Transfer Object containing task information.
	 * @param token Token data identifying the user creating the task.
	 * @throws {InvalidToken} Thrown if the token does not correspond to a valid user.
	 * @returns A promise that resolves to the created Task entity.
	 */
	async execute(taskInfo: TaskCreateDTO, token: TokenDataDTO): Promise<Task> {
		const user = await this.userRepository.findById(token.sub);
		if (!user) throw new InvalidToken();

		const task = new Task(
			user,
			Task.newId(),
			TaskName.create(taskInfo.name),
			taskInfo.content ?? "",
			DateTime.now(),
			DateTime.now(),
			taskInfo.notifyAt ? DateTime.fromISO(taskInfo.notifyAt) : null,
			taskInfo.notifyType == "Never" ? "VOID" : "SCHEDULED",
			taskInfo.notifyType
		);

		await this.schedulerRepository.schedule(task);
		return await this.taskRepository.create(user, task);
	}
}
