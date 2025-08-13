import { ApiProperty } from "@nestjs/swagger";

export class documentation_CreateTaskControllerDTO {

	@ApiProperty({description: "Name of the task", type: "string"})
	name: string;

}

export class documentation_IInDelteTaskControllerDTO {

	@ApiProperty({description: "id of task", type: "string"})
	id: string;

}

export class documentation_IInTaskControllerDTO {

	@ApiProperty({description: "id of task", type: "string"})
	id: string;

	@ApiProperty({description: "name of task", type: "string"})
	name: string;

	@ApiProperty({description: "content of task", type: "string"})
	content: string;

	@ApiProperty({description: "datetime in iso format of task creation", type: "string"})
	createdAt: string;

	@ApiProperty({description: "datetime in iso format of task updated", type: "string"})
	updatedAt: string;

	@ApiProperty({description: "datetime in iso format of task notify", type: "string"})
	notifyAt: string | null;

}