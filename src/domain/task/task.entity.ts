import { DateTime } from "luxon";
import { User } from "../user/user.entity";
import { TaskName } from "./task-name.value-object";
import { ulid } from "ulid";

/**
 * Types representing task notification behavior and status.
 */
export type TaskNotifyType = "EveryTime" | "OneTime" | "Never";
export type TaskNotifyStatus = "PENDIGN" | "SENT" | "SCHEDULED" | "VOID";

/**
 * Entity representing a user's task with notification support.
 */
export class Task {
	/** Task name as a value object */
	public name: TaskName;

	/** Task content or description */
	public content: string;

	/** Timestamp when the task was created */
	public readonly createdAt: DateTime;

	/** Timestamp when the task was last updated */
	public updatedAt: DateTime;

	/** Scheduled notification time, if any */
	public notifyAt: DateTime | null;

	/** Current status of the task notification */
	public notifyStatus: TaskNotifyStatus;

	/** Type of notification for the task */
	public notifyType: TaskNotifyType;

	/** Job ID associated with scheduled notifications */
	public jobId: string | null;

	/**
	 * Creates a new Task entity.
	 * @param user The owner of the task.
	 * @param id Unique identifier of the task.
	 * @param name Task name as a TaskName value object.
	 * @param content Task content or description.
	 * @param createdAt Task creation timestamp.
	 * @param updatedAt Task last update timestamp.
	 * @param notifyAt Optional scheduled notification timestamp.
	 * @param notifyStatus Current notification status.
	 * @param notifyType Type of notification.
	 * @param jobId Optional job ID for scheduled notifications.
	 */
	constructor(
		public readonly user: User,
		public readonly id: string,
		name: TaskName,
		content: string,
		createdAt: DateTime,
		updatedAt: DateTime,
		notifyAt: DateTime | null,
		notifyStatus: TaskNotifyStatus,
		notifyType: TaskNotifyType,
		jobId?: string | null
	) {
		this.name = name;
		this.content = content;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.notifyAt = notifyAt;
		this.notifyStatus = notifyStatus;
		this.notifyType = notifyType;
		this.jobId = jobId ?? null;
	}

	/**
	 * Updates the task's name and content.
	 * @param name New task name.
	 * @param content New task content.
	 */
	public update(name: TaskName, content: string): void {
		this.name = name;
		this.content = content;
		this.updatedAt = DateTime.now();
	}

	/**
	 * Sets the job ID associated with a scheduled notification.
	 * @param jobId The job ID to set.
	 */
	public setJobId(jobId: string): void {
		this.jobId = jobId;
	}

	/**
	 * Schedules a notification for the task.
	 * @param notifyAt The timestamp when the notification should occur.
	 * @param notifyType Type of notification.
	 */
	public scheduleNotification(notifyAt: DateTime, notifyType: TaskNotifyType): void {
		this.notifyAt = notifyAt;
		this.notifyType = notifyType;
		this.notifyStatus = "SCHEDULED";
		this.updatedAt = DateTime.now();
	}

	/** Marks the task notification as sent */
	public markAsSent(): void {
		this.notifyStatus = "SENT";
	}

	/** Marks the task notification as pending */
	public markAsPending(): void {
		this.notifyStatus = "PENDIGN";
	}

	/** Marks the task notification as scheduled */
	public markAsScheduled(): void {
		this.notifyStatus = "SCHEDULED";
	}

	/**
	 * Generates a new unique ID for a task.
	 * @returns A ULID string.
	 */
	static newId(): string {
		return ulid();
	}
}
