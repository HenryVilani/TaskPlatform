import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length, Matches, Max } from "class-validator";
import { Task } from "src/domain/task/task.entity";

/**
 * Data Transfer Object (DTO) for WebSocket task notifications.
 * 
 * This class is used to structure the data sent over WebSocket when notifying clients
 * about task updates. It includes validation rules and Swagger metadata.
 */
export class WSNotifyDTO {

	/**
	 * Unique identifier of the task.
	 * Must be a valid ULID (26-character string using characters 0-9, A-H, J-K, M-N, P-T, V-Z).
	 * Example: "01H4ZK8T0A7E4VY5M7C2Q2XK8"
	 */
	@ApiProperty({
		description: "Id of the task",
		type: "string",
		example: "01H4ZK8T0A7E4VY5M7C2Q2XK8",
		required: true
	})
	@Matches(/^[0-9A-HJKMNP-TV-Z]{26}$/, { message: 'Field must be a valid ULID' })
	id: string;

	/**
	 * Name of the task.
	 * Must be a non-empty string between 1 and 40 characters.
	 * Example: "Task 01"
	 */
	@ApiProperty({
		description: "Name of the task",
		type: "string",
		example: "Task 01",
		required: true
	})
	@IsString()
	@IsNotEmpty()
	@Length(1, 40, { message: "Task name must be between 1 and 40 characters" })
	name: string;

	/**
	 * Preview content of the task.
	 * Must be a non-empty string with a maximum length of 255 characters.
	 * Example: "Homework"
	 */
	@ApiProperty({
		description: "Content of the task",
		type: "string",
		example: "Homework",
		required: true
	})
	@IsString()
	@IsNotEmpty()
	@Max(255, { message: "The task content is too large" })
	previewContent: string;

	/**
	 * Creates a WSNotifyDTO instance from a Task entity.
	 * 
	 * @param task - The Task entity to convert
	 * @returns WSNotifyDTO - The WebSocket notification DTO
	 * 
	 * The `previewContent` is truncated to 255 characters to comply with validation rules.
	 */
	static fromTask(task: Task): WSNotifyDTO {

		const wsTask = new WSNotifyDTO();

		wsTask.id = task.id;
		wsTask.name = task.name.value;
		wsTask.previewContent = task.content.slice(0, 255);

		return wsTask;

	}

}
