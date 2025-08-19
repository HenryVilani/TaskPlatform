import { Task } from "src/domain/task/task.entity";

/**
 * Interface for task scheduling repository operations.
 */
export interface ISchedulerRepository {
	/**
	 * Schedules a task for execution.
	 * @param task The task entity to schedule.
	 * @returns A promise that resolves when the task has been scheduled.
	 */
	schedule(task: Task): Promise<void>;

	/**
	 * Removes a scheduled task by its job ID.
	 * @param jobId The unique identifier of the scheduled job.
	 * @returns A promise that resolves when the schedule has been removed.
	 */
	removeSchedule(jobId: string): Promise<void>;

	/**
	 * Updates the schedule of an existing task.
	 * @param task The task entity with updated scheduling information.
	 * @returns A promise that resolves when the schedule has been updated.
	 */
	updateSchedule(task: Task): Promise<void>;

	/**
	 * Retrieves a scheduled task by its job ID.
	 * @param jobId The unique identifier of the scheduled job.
	 * @returns A promise that resolves to the Task if found, or null if not found.
	 */
	getSchedule(jobId: string): Promise<Task | null>;
}
