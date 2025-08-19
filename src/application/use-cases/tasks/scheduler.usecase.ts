import { Inject, Injectable } from "@nestjs/common";
import { type ISchedulerRepository } from "src/application/services/scheduler.repository";
import { Task } from "src/domain/task/task.entity";

/**
 * Use case responsible for scheduling a task.
 */
@Injectable()
export class SchedulerTaskUseCase {
	/**
	 * @param schedulerRepository Repository used to schedule tasks.
	 */
	constructor(
		@Inject("ISchedulerRepository") private schedulerRepository: ISchedulerRepository,
	) {}

	/**
	 * Executes the scheduling of a task.
	 * @param task The task entity to be scheduled.
	 * @returns A promise that resolves when the task has been scheduled.
	 */
	async execute(task: Task): Promise<void> {
		this.schedulerRepository.schedule(task);
	}
}
