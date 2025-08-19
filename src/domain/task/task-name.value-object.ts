import { InvalidTaskName } from "src/application/erros/task.error";

/**
 * Value Object representing the name of a task.
 * Ensures that task names are valid and within the required length.
 */
export class TaskName {
	/**
	 * The value of the task name.
	 */
	public readonly value: string;

	/**
	 * Private constructor to enforce creation through the static `create` method.
	 * @param name The validated name of the task.
	 */
	private constructor(name: string) {
		this.value = name;
	}

	/**
	 * Creates a new TaskName instance after validating the provided name.
	 * @param name The name to create a TaskName from.
	 * @throws {InvalidTaskName} Thrown if the name is empty or exceeds 40 characters.
	 * @returns A new TaskName instance.
	 */
	public static create(name: string): TaskName {
		const trimmed = name.trim();

		if (trimmed.length < 1 || trimmed.length > 40) {
			throw new InvalidTaskName();
		}

		return new TaskName(trimmed);
	}

	/**
	 * Compares this TaskName with another to check for equality.
	 * @param other Another TaskName instance to compare with.
	 * @returns True if both task names are equal, false otherwise.
	 */
	public equals(other: TaskName): boolean {
		return this.value === other.value;
	}
}
