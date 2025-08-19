import { ApiProperty } from "@nestjs/swagger";
import { Task, type TaskNotifyType } from "src/domain/task/task.entity";
import { IsBase64, IsIn, IsInt, IsISO8601, IsNotEmpty, IsOptional, IsString, Length, Matches, Max, Min, ValidateIf } from "class-validator"
import { TaskSegment } from "src/domain/task/task-segment";

/**
 * DTO for creating a new task
 */
export class TaskCreateDTO {

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

	@ApiProperty({
		description: "Content of the task",
		type: "string",
		example: "Homework",
		required: false,
	})
	@IsString()
	@IsOptional()
	content?: string;

	@ApiProperty({
		description: "Notify datetime in ISO 8601 format for the task",
		type: "string",
		example: "2025-08-13T12:34:56.789Z",
		required: false
	})
	@IsISO8601({}, { message: "notifyAt must be a valid ISO 8601 date" })
	@IsOptional()
	notifyAt?: string;

	@ApiProperty({
		description: "Notify type of the task (EveryTime | OneTime | Never)",
		type: "string",
		example: "EveryTime",
		required: false
	})
	@IsIn(["EveryTime", "OneTime", "Never"], { message: 'notifyType must be EveryTime | OneTime | Never' })
	notifyType: TaskNotifyType;

}

/**
 * DTO for identifying a task by ID (ULID format)
 */
export class TaskIdentifierDTO {

	@ApiProperty({
		description: "Id of the task",
		type: "string",
		example: "01K31DX9HCR81KKD18HXGARCVQ",
		required: true
	})
	@Matches(/^[0-9A-HJKMNP-TV-Z]{26}$/, { message: 'Field must be a valid ULID' })
	id: string;

}

/**
 * DTO representing a task entity for output
 */
export class TaskDTO {

	@ApiProperty({
		description: "Id of the task",
		type: "string",
		example: "01K31DX9HCR81KKD18HXGARCVQ",
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
	@Length(1, 40, { message: "Task name must be between 1 and 40 characters" })
	name: string;

	@ApiProperty({
		description: "Content of the task",
		type: "string",
		example: "Homework",
		required: true
	})
	@IsString()
	@IsNotEmpty()
	@Max(2024, { message: "The task content is too large" })
	content: string;

	@ApiProperty({
		description: "Created datetime of the task in ISO 8601 format",
		type: "string",
		example: "2025-08-13T12:34:56.789Z",
		required: true
	})
	@IsNotEmpty()
	@IsISO8601({}, { message: "createdAt must be a valid ISO 8601 date" })
	createdAt: string;

	@ApiProperty({
		description: "Updated datetime of the task in ISO 8601 format",
		type: "string",
		example: "2025-08-13T12:34:56.789Z",
		required: true
	})
	@IsNotEmpty()
	@IsISO8601({}, { message: "updatedAt must be a valid ISO 8601 date" })
	updatedAt: string;

	@ApiProperty({
		description: "Notify datetime of the task in ISO 8601 format, nullable",
		type: "string",
		example: "2025-08-13T12:34:56.789Z",
		nullable: true,
		required: true
	})
	@IsNotEmpty()
	@ValidateIf(o => o.name !== null)
	@IsISO8601({}, { message: "notifyAt must be a valid ISO 8601 date" })
	notifyAt: string | null;

	/**
	 * Maps a Task entity to TaskDTO
	 */
	static fromTask(task: Task): TaskDTO {
		const dto = new TaskDTO();
		dto.id = task.id;
		dto.name = task.name.value;
		dto.content = task.content;
		dto.createdAt = task.createdAt.toISO()!;
		dto.updatedAt = task.updatedAt.toISO()!;
		dto.notifyAt = task.notifyAt ? task.notifyAt.toISO()! : null;
		return dto;
	}

}

/**
 * DTO for updating a task
 */
export class TaskUpdateDTO {

	@ApiProperty({
		description: "Id of the task",
		type: "string",
		example: "01K31DX9HCR81KKD18HXGARCVQ",
		required: true
	})
	@Matches(/^[0-9A-HJKMNP-TV-Z]{26}$/, { message: 'Field must be a valid ULID' })
	id: string;

	@ApiProperty({
		description: "Updated name of the task",
		type: "string",
		example: "Task 01",
		required: true
	})
	@IsString()
	@IsNotEmpty()
	@Length(1, 40, { message: "Task name must be between 1 and 40 characters" })
	name: string;

	@ApiProperty({
		description: "Updated content of the task",
		type: "string",
		example: "Homework",
		required: true
	})
	@IsString()
	@IsNotEmpty()
	@Max(2024, { message: "The task content is too large" })
	content: string;

	@ApiProperty({
		description: "Updated notify datetime in ISO 8601 format",
		type: "string",
		example: "2025-08-13T12:34:56.789Z",
		nullable: true
	})
	@IsISO8601({}, { message: 'notifyAt must be a valid ISO 8601 date' })
	@IsOptional()
	notifyAt?: string;

}

/**
 * DTO for fetching a paginated segment of tasks
 */
export class TaskFetchSegmentDTO {

	@ApiProperty({
		description: "Limit of tasks fetched",
		type: "integer",
		example: 10,
		default: 10,
		required: true
	})
	@IsInt()
	@Min(1)
	limit: number;

	@ApiProperty({
		description: "Cursor for pagination (Base64 encoded)",
		type: "string",
		example: "MDFINFpLOFQwQTdFNFZZNU03QzJRMlhLOA==",
	})
	@IsString()
	@IsOptional()
	@IsBase64()
	cursor?: string;

}

/**
 * DTO for returning a paginated segment of tasks
 */
export class TaskReturnSegmentDTO {

	tasks: TaskDTO[];
	cursor?: string;
	hasMore: boolean;

	/**
	 * Maps a TaskSegment entity to TaskReturnSegmentDTO
	 */
	static fromSegment(segment: TaskSegment): TaskReturnSegmentDTO {
		const returnSegment = new TaskReturnSegmentDTO();
		returnSegment.tasks = segment.tasks.map(TaskDTO.fromTask);
		returnSegment.hasMore = segment.hasMore;
		returnSegment.cursor = segment.cursor;
		return returnSegment;
	}

}
