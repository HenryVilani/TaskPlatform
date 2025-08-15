import { Inject, Injectable } from "@nestjs/common";
import { isValid } from "ulid";
import { Task } from "src/domain/task/task.entity";
import { DateTime } from "luxon";
import { type ITaskRepository } from "src/application/repositories/task.repository";
import { InvalidId, InvalidToken } from "src/application/erros/auth.errors";
import { TokenDataDTO } from "src/application/dtos/token.dto";
import { type IUserRepository } from "src/application/repositories/user.respotory";
import { TaskNotFound } from "src/application/erros/task.error";
import { TaskUpdateDTO } from "src/interfaces/http/v1/dtos/task.dto";
import { TaskName } from "src/domain/task/task-name.value-object";

@Injectable()
export class UpdateTaskUseCase {

	constructor (
		@Inject("ITaskRepository") private readonly taskRepository: ITaskRepository,
		@Inject("IUserRepository") private readonly userRepository: IUserRepository
	) {}

	async execute(taskData: TaskUpdateDTO, token: TokenDataDTO): Promise<Task> {

		if (!isValid(taskData.id)) throw new InvalidId();

		const user = await this.userRepository.findById(token.sub);
		if (!user) throw new InvalidToken();

		const task = await this.taskRepository.findById(user, taskData.id);
		if (!task) throw new TaskNotFound();
	

		const updatedTask = new Task(
			user,
			taskData.id, 
			TaskName.create(taskData.name),
			taskData.content, 
			task.createdAt, 
			DateTime.now(), 
			taskData.notifyAt ? DateTime.fromISO(taskData.notifyAt) : null,
			task.notified,
			task.notifyType
		);

		
		return await this.taskRepository.update(user, updatedTask)

	}

}
