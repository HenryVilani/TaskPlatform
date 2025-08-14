import { Inject, Injectable } from "@nestjs/common";
import { type ISchedulerRepository } from "src/application/services/scheduler.repository";
import { Task } from "src/domain/task.domain";

@Injectable()
export class SchedulerTaskUseCase {

	constructor(
		@Inject("ISchedulerRepository") private schedulerRepository: ISchedulerRepository,
	) {}

	async execute(task: Task) {

		this.schedulerRepository.schedule(task);

	}

}
