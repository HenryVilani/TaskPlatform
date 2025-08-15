import { Body, Controller, Get, Inject, Logger, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { type Request } from "express";
import { TokenDataDTO } from "../../../application/dtos/token.dto";
import { InvalidToken } from "src/application/erros/auth.errors";
import { StatusDTO } from "src/application/dtos/status.dto";
import { CreateTaskUseCase } from "src/application/use-cases/tasks/create.usecase";
import { UpdateTaskUseCase } from "src/application/use-cases/tasks/update.usecase";
import { DeleteTaskUseCase } from "src/application/use-cases/tasks/delete.usecase";
import { ListTaskUseCase } from "src/application/use-cases/tasks/list.usecase";
import { BaseError } from "src/application/erros/base.errors";
import { ApiBody, ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath } from "@nestjs/swagger";
import { TaskCreateDTO, TaskDTO, TaskIdentifierDTO, TaskFetchSegmentDTO, TaskUpdateDTO, TaskReturnSegmentDTO } from "./dtos/task.dto";
import { JWTGuard } from "src/infrastructure/auth/jwt/jwt.guard";

@ApiExtraModels(StatusDTO, TaskDTO)
@ApiTags("Task")
@Controller("task")
export class TaskController {

    constructor (
		private readonly createTaskUseCase: CreateTaskUseCase,
		private readonly updateTaskUseCase: UpdateTaskUseCase,
		private readonly deleteTaskUseCase: DeleteTaskUseCase,
		private readonly listTaskUseCase: ListTaskUseCase
	) {}

	@UseGuards(JWTGuard)
	@Post("create")
	@ApiOperation({ 
		summary: "Create",
		description: "Create a task"
	})
	@ApiResponse({
		status: 200,
		description: "Return the created task",
		example: {
			status: "created",
			data: {
				id: "01H4ZK8T0A7E4VY5M7C2Q2XK8",
				name: "Task 01",
				content: "Homework",
				createdAt: "2025-08-13T12:34:56.789Z",
				updatedAt: "2025-08-13T12:34:56.789Z",
				notifyAt: "2025-08-13T12:34:56.789Z"
			}
		},
		schema: {
			allOf: [
				{ $ref: getSchemaPath(StatusDTO) },
				{
					properties: {
						data: { $ref: getSchemaPath(TaskDTO)}
					}
				}
			]
		}
	})
	@ApiResponse({
		status: 400,
		description: "Invalid Session",
		example: new StatusDTO("invalid_token"),
		type: StatusDTO
	})
	@ApiResponse({
		status: 401,
		description: "Unauthorized",
		example: new StatusDTO("unauthorized"),
		type: StatusDTO
	})
	@ApiBody({ type: TaskCreateDTO })
	async createTask(@Req() request: Request, @Body() body: TaskCreateDTO): Promise<StatusDTO<TaskDTO>> {

		try {

			const task = await this.createTaskUseCase.execute(body, request.user as TokenDataDTO);

			return new StatusDTO<TaskDTO>("created", TaskDTO.fromTask(task));
			

		}catch (error) {

			if (error instanceof InvalidToken) {

				return new StatusDTO(error.id);

			}else {

				Logger.log(error)
				return new StatusDTO("unknown_error");

			}

		}


	}

	@UseGuards(JWTGuard)
	@Post("update")
	@ApiOperation({ 
		summary: "Update",
		description: "Update an existing task"
	})
	@ApiBody({ type: TaskUpdateDTO })
	@ApiResponse({ 
		status: 200, 
		description: "Task successfully updated", 
		example: {
			status: "created",
			data: {
				id: "01H4ZK8T0A7E4VY5M7C2Q2XK8",
				name: "Task 01",
				content: "Homework",
				createdAt: "2025-08-13T12:34:56.789Z",
				updatedAt: "2025-08-13T12:34:56.789Z",
				notifyAt: "2025-08-13T12:34:56.789Z"
			}
		},
		schema: {
			allOf: [
				{ $ref: getSchemaPath(StatusDTO) },
				{
					properties: {
						data: { $ref: getSchemaPath(TaskDTO)}
					}
				}
			]
		}
	})
	@ApiResponse({ 
		status: 400, 
		description: "Error", 
		type: StatusDTO<string>, 
		examples: {
			"invalid_token": {
				summary: "Invalid Session",
				value: new StatusDTO("invalid_token") 
			},
			"task_not_found": {
				summary: "Task not found",
				value: new StatusDTO<string>("task_not_found")
			}
			
		},

	})
	@ApiResponse({
		status: 401,
		description: "Unauthorized",
		example: new StatusDTO("unauthorized"),
		type: StatusDTO
	})
	async updateTask(@Req() request: Request, @Body() body: TaskUpdateDTO): Promise<StatusDTO<TaskDTO>> {

		try {

			const task = await this.updateTaskUseCase.execute({
				...body
			}, request.user as TokenDataDTO);

			return new StatusDTO<TaskDTO>("updated", TaskDTO.fromTask(task));
			

		}catch (error) {

			if (error instanceof InvalidToken) {

				return new StatusDTO(error.id);

			}else {

				Logger.log(error)
				return new StatusDTO("unknown_error");

			}

		}

	}

	@UseGuards(JWTGuard)
	@Post("delete")
	@ApiOperation({ 
		summary: "Delete",
		description: "Delete a task"
	})
	@ApiBody({ type: TaskIdentifierDTO })
	@ApiResponse({ 
		status: 200,
		description: "Task successfully deleted",
		example: {
			status: "deleted"
		}
	})
	@ApiResponse({ 
		status: 400, 
		description: "Error", 
		type: StatusDTO<string>, 
		examples: {
			"invalid_token": {
				summary: "Invalid Session",
				value: new StatusDTO("invalid_token") 
			},
			"task_not_found": {
				summary: "Task not found",
				value: new StatusDTO("task_not_found")
			}
			
		},

	})
	@ApiResponse({
		status: 401,
		description: "Unauthorized",
		example: new StatusDTO("unauthorized"),
		type: StatusDTO
	})
	async deleteTask(@Req() request: Request, @Body() body: TaskIdentifierDTO): Promise<StatusDTO<void>> {

		try {

			await this.deleteTaskUseCase.execute(body.id, request.user as TokenDataDTO);
			
			return new StatusDTO("deleted");

		}catch (error) {

			if (error instanceof BaseError) {

				return new StatusDTO(error.id);

			}else {

				return new StatusDTO("unknown_error");

			}

		}

	}

	@UseGuards(JWTGuard)
	@Post("list")
	@ApiOperation({ 
		summary: "List",
		description: "List tasks"
	})
	@ApiResponse({ 
		status: 200,
		description: "Task retrived successfully",
		example: {
			limit: 10
		},
		schema: {
			allOf: [
				{ $ref: getSchemaPath(StatusDTO) },
				{
					properties: {
						data: { 
							properties: {

								tasks: {
									type: "array",
									items: { $ref: getSchemaPath(TaskDTO) }
	
								},
								next: {
									type: "string"
								},
								previous: {
									type: "string",
									nullable: true
								}

							} 
						},
					}
				}
			]
		}
	})
	@ApiResponse({ 
		status: 400, 
		description: "Error", 
		type: StatusDTO<string>, 
		examples: {
			"invalid_token": {
				summary: "Invalid Session",
				value: new StatusDTO("invalid_token") 
			},
			
		},

	})
	@ApiResponse({
		status: 401,
		description: "Unauthorized",
		example: new StatusDTO("unauthorized"),
		type: StatusDTO
	})
	async listTasks(@Req() request: Request, @Body() body: TaskFetchSegmentDTO): Promise<StatusDTO<TaskReturnSegmentDTO>> {

		try {

			let segment = await this.listTaskUseCase.execute(request.user as TokenDataDTO, body.limit, body.cursor);

			return new StatusDTO<TaskReturnSegmentDTO>("tasks", TaskReturnSegmentDTO.fromSegment(segment));


		}catch (error) {

			if (error instanceof BaseError) {

				return new StatusDTO(error.id);

			}else {

				Logger.log(error)
				return new StatusDTO("unknown_error");

			}

		}

	}

}
