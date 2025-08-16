import { DateTime } from "luxon";
import { User } from "../user/user.entity";
import { TaskName } from "./task-name.value-object";
import { ulid } from "ulid";


export type TaskNotifyType = "EveryTime" | "OneTime" | "Never";
export type TaskNotifyStatus = "PENDIGN" | "SENT" | "SCHEDULED" | "VOID";


export class Task {
	public name: TaskName;
	public content: string;
	public readonly createdAt: DateTime;
	public updatedAt: DateTime;
	public notifyAt: DateTime | null;
	public notifyStatus: TaskNotifyStatus;
	public notifyType: TaskNotifyType;

	constructor(
		public readonly user: User,
		public readonly id: string,
		name: TaskName,
		content: string,
		createdAt: DateTime,
		updatedAt: DateTime,
		notifyAt: DateTime | null,
		notifyStatus: TaskNotifyStatus,
		notifyType: TaskNotifyType
	) {
		this.name = name;
		this.content = content;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.notifyAt = notifyAt;
		this.notifyStatus = notifyStatus;
		this.notifyType = notifyType;
	}

	public update(name: TaskName, content: string): void {
		this.name = name;
		this.content = content;
		this.updatedAt = DateTime.now();
	}

	public scheduleNotification(notifyAt: DateTime, notifyType: TaskNotifyType): void {
		this.notifyAt = notifyAt;
		this.notifyType = notifyType;
		this.notifyStatus = "SCHEDULED";
		this.updatedAt = DateTime.now();
	}

	public markAsSent(): void {
		this.notifyStatus = "SENT";
	}

	public markAsPending(): void {
		this.notifyStatus = "PENDIGN";
	}

	public markAsScheduled(): void {
		this.notifyStatus = "SCHEDULED";
	}
	static newId(): string {
		return ulid();
	}
}

