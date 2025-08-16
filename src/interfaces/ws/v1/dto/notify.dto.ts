import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length, Matches, Max } from "class-validator";
import { Task } from "src/domain/task/task.entity";
import { TaskDTO } from "src/interfaces/http/v1/dtos/task.dto";

export class NotifyWebsocketDTO {

	id: string;
	task: TaskDTO;

}

export class WSTaskDTO {

	@ApiProperty({
		description: "Id of the task",
		type: "string",
		example: "01H4ZK8T0A7E4VY5M7C2Q2XK8",
		required: true
	})
	@Matches(/^[0-9A-HJKMNP-TV-Z]{26}$/, { message: 'Field must be a valid ULID' })
	id: string;
	
	@ApiProperty({
		description: "Name of the task",
		type: "string",
		example: "Task 01",
		required: true
	})
	@IsString()
	@IsNotEmpty()
	@Length(1, 40, {message: "Task name must be between 1 and 40 characters"})
	name: string;

	@ApiProperty({
		description: "Content of the task",
		type: "string",
		example: "Homework",
		required: true
	})
	@IsString()
	@IsNotEmpty()
	@Max(255, {message: "The task content is too large"})
	previewContent: string;

	static fromTask(task: Task): WSTaskDTO {

		const wsTask = new WSTaskDTO();

		wsTask.id = task.id;
		wsTask.name = task.name.value;
		wsTask.previewContent = task.content.slice(0, 255);

		return wsTask;

	}

}
