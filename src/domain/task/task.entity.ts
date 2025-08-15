import { DateTime } from "luxon";
import { User } from "../user/user.entity";
import { TaskName } from "./task-name.value-object";
import { ulid } from "ulid";


export type TaskNotifyType = "EveryTime" | "OneTime"


export class Task {

	private _name: TaskName;
	private _content: string;
	private readonly _createdAt: DateTime;
	private _updatedAt: DateTime;
	private _notifyAt: DateTime | null;
	private _notified: boolean | null;
	private _notifyType: TaskNotifyType | null;

	constructor(
		public readonly user: User,
		public readonly id: string,
		name: TaskName,
		content: string,
		createdAt: DateTime,
		updatedAt: DateTime,
		notifyAt: DateTime | null = null,
		notified: boolean | null = null,
		notifyType: TaskNotifyType | null = null
	) {
		this._name = name;
		this._content = content;
		this._createdAt = createdAt;
		this._updatedAt = updatedAt;
		this._notifyAt = notifyAt;
		this._notified = notified;
		this._notifyType = notifyType;
	}


	get createdAt(): DateTime {
		return this._createdAt;
	}

	get updatedAt(): DateTime {
		return this._updatedAt;
	}

	get name(): TaskName {
		return this._name;
	}

	get content(): string {
		return this._content;
	}

	get notifyAt(): DateTime | null {
		return this._notifyAt;
	}

	get notified(): boolean | null {
		return this._notified;
	}

	get notifyType(): TaskNotifyType | null {
		return this._notifyType;
	}

	public update(name: TaskName, content: string): void {
		this._name = name;
		this._content = content;
		this._updatedAt = DateTime.now();
	}

	public scheduleNotification(notifyAt: DateTime, notifyType: TaskNotifyType): void {
		this._notifyAt = notifyAt;
		this._notifyType = notifyType;
		this._notified = false;
		this._updatedAt = DateTime.now();
	}


	public markAsNotified(): void {
		this._notified = true;
		this._updatedAt = DateTime.now();
	}


	public clearNotification(): void {
		this._notifyAt = null;
		this._notifyType = null;
		this._notified = null;
		this._updatedAt = DateTime.now();
	}

	static newId(): string {

		return ulid();

	}

}

