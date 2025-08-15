import { InvalidTaskName } from "src/application/erros/task.error";

export class TaskName {

	public readonly value: string;

	private constructor(name: string) {
		this.value = name;
	}

	public static create(name: string): TaskName {
		const trimmed = name.trim();

		if (trimmed.length < 1 || trimmed.length > 40) {
			throw new InvalidTaskName();
		}

		return new TaskName(trimmed);
	}

	public equals(other: TaskName): boolean {
		return this.value === other.value;
	}

}
