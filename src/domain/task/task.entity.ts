import { DateTime } from "luxon";
import { User } from "../user/user.entity";
import { TaskName } from "./task-name.value-object";
import { ulid } from "ulid";


export type TaskNotifyType = "EveryTime" | "OneTime"
export type TaskNotifyStatus = "PENDIGN" | "SENT" | "SCHEDULED"


export class Task {
	public name: TaskName;
	public content: string;
	public readonly createdAt: DateTime;
	public updatedAt: DateTime;
	public notifyAt: DateTime | null;
	public notifyStatus: TaskNotifyStatus | null;
	public notifyType: TaskNotifyType | null;

	constructor(
		public readonly user: User,
		public readonly id: string,
		name: TaskName,
		content: string,
		createdAt: DateTime,
		updatedAt: DateTime,
		notifyAt: DateTime | null = null,
		notifyStatus: TaskNotifyStatus | null = null,
		notifyType: TaskNotifyType | null = null
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

	public markAsNotified(): void {
		this.notifyStatus = "SENT";
		this.updatedAt = DateTime.now();
	}

	public clearNotification(): void {
		this.notifyAt = null;
		this.notifyType = null;
		this.notifyStatus = null;
		this.updatedAt = DateTime.now();
	}

	static newId(): string {
		return ulid();
	}
}

