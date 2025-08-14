import { ApiProperty } from "@nestjs/swagger";
import { Task, TaskSegment } from "src/domain/task.domain";


export class TaskCreateDTO {
	@ApiProperty({
		description: "Name of the task",
		type: "string",
		example: "Task 01"
	})
	name: string;
}

export class TaskIdentifierDTO {

	@ApiProperty({
		description: "Id of the task",
		type: "string",
		example: "01H4ZK8T0A7E4VY5M7C2Q2XK8"
	})
	id: string;

}

export class TaskDTO {

	@ApiProperty({
		description: "Id of the task",
		type: "string",
		example: "01H4ZK8T0A7E4VY5M7C2Q2XK8"
	})
	id: string;

	@ApiProperty({
		description: "Name of the task",
		type: "string",
		example: "Task 01"
	})
	name: string;

	@ApiProperty({
		description: "Content of the task",
		type: "string",
		example: "Homework"
	})
	content: string;

	@ApiProperty({
		description: "Created datetime of the task in ISO 8601 format",
		type: "string",
		example: "2025-08-13T12:34:56.789Z"
	})
	createdAt: string;

	@ApiProperty({
		description: "Updated datetime of the task in ISO 8601 format",
		type: "string",
		example: "2025-08-13T12:34:56.789Z"
	})
	updatedAt: string;

	@ApiProperty({
		description: "Notify datetime of the task in ISO 8601 format",
		type: "string",
		example: "2025-08-13T12:34:56.789Z",
		nullable: true
	})
	notifyAt: string | null;

	static fromTask(task: Task): TaskDTO {

		const dto = new TaskDTO();

		dto.id = task.id;
		dto.name = task.name.validatedName;
		dto.content = task.content;
		dto.createdAt = task.createdAt.toISO()!;
		dto.updatedAt = task.updatedAt.toISO()!;
		dto.notifyAt = task.notifyAt ? task.notifyAt.toISO()! : null;

		return dto;

	}

}

export class TaskUpdateDTO {

	@ApiProperty({
		description: "Id of the task",
		type: "string",
		example: "01H4ZK8T0A7E4VY5M7C2Q2XK8"
	})
	id: string;

	@ApiProperty({
		description: "Name of the task",
		type: "string",
		example: "Task 01"
	})
	name: string;

	@ApiProperty({
		description: "Content of the task",
		type: "string",
		example: "Homework"
	})
	content: string;

	@ApiProperty({
		description: "Notify datetime of the task in ISO 8601 format",
		type: "string",
		example: "2025-08-13T12:34:56.789Z",
		nullable: true
	})
	notifyAt: string | null;

}

export class TaskFetchSegmentDTO {

	limit: number;
	cursor: string;

}

export class TaskReturnSegmentDTO {

	tasks: TaskDTO[];
	cursor?: string;
	hasMore: boolean;

	static fromSegment(segment: TaskSegment): TaskReturnSegmentDTO {

		const returnSegment = new TaskReturnSegmentDTO();

		returnSegment.tasks = segment.tasks.map(TaskDTO.fromTask);
		returnSegment.hasMore = segment.hasMore;
		returnSegment.cursor = segment.cursor;
		
		return returnSegment;

	}


}