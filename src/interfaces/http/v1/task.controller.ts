import { Body, Controller, Logger, Post, Req, UseGuards } from "@nestjs/common";
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
import { HealthCheckGuard } from "src/infrastructure/health/health.guard";

@ApiExtraModels(StatusDTO, TaskDTO)
@ApiTags("Task")
@Controller("task")
export class TaskController {

	constructor(
		private readonly createTaskUseCase: CreateTaskUseCase,
		private readonly updateTaskUseCase: UpdateTaskUseCase,
		private readonly deleteTaskUseCase: DeleteTaskUseCase,
		private readonly listTaskUseCase: ListTaskUseCase
	) {}

	/**
	 * POST /task/create
	 * Creates a new task for the authenticated user.
	 */
	@UseGuards(JWTGuard)
	@UseGuards(HealthCheckGuard)
	@Post("create")
	@ApiOperation({ summary: "Create", description: "Create a task" })
	@ApiResponse({
		status: 200,
		description: "Return the created task",
		schema: {
			allOf: [
				{ $ref: getSchemaPath(StatusDTO) },
				{ properties: { data: { $ref: getSchemaPath(TaskDTO) } } }
			]
		}
	})
	@ApiResponse({ status: 400, description: "Invalid Session", example: new StatusDTO("invalid_token"), type: StatusDTO })
	@ApiResponse({ status: 401, description: "Unauthorized", example: new StatusDTO("unauthorized"), type: StatusDTO })
	@ApiBody({ type: TaskCreateDTO })
	async createTask(@Req() request: Request, @Body() body: TaskCreateDTO): Promise<StatusDTO<TaskDTO>> {
		try {
			const task = await this.createTaskUseCase.execute(body, request.user as TokenDataDTO);
			return new StatusDTO<TaskDTO>("created", TaskDTO.fromTask(task));
		} catch (error) {
			if (error instanceof InvalidToken) return new StatusDTO(error.id);
			Logger.log(error);
			return new StatusDTO("unknown_error");
		}
	}

	/**
	 * POST /task/update
	 * Updates an existing task for the authenticated user.
	 */
	@UseGuards(JWTGuard)
	@UseGuards(HealthCheckGuard)
	@Post("update")
	@ApiOperation({ summary: "Update", description: "Update an existing task" })
	@ApiBody({ type: TaskUpdateDTO })
	@ApiResponse({
		status: 200,
		description: "Task successfully updated",
		schema: {
			allOf: [
				{ $ref: getSchemaPath(StatusDTO) },
				{ properties: { data: { $ref: getSchemaPath(TaskDTO) } } }
			]
		}
	})
	@ApiResponse({ status: 400, description: "Error", type: StatusDTO<string> })
	@ApiResponse({ status: 401, description: "Unauthorized", type: StatusDTO })
	async updateTask(@Req() request: Request, @Body() body: TaskUpdateDTO): Promise<StatusDTO<TaskDTO>> {
		try {
			const task = await this.updateTaskUseCase.execute(body, request.user as TokenDataDTO);
			return new StatusDTO<TaskDTO>("updated", TaskDTO.fromTask(task));
		} catch (error) {
			if (error instanceof InvalidToken) return new StatusDTO(error.id);
			Logger.log(error);
			return new StatusDTO("unknown_error");
		}
	}

	/**
	 * POST /task/delete
	 * Deletes a task by its ID for the authenticated user.
	 */
	@UseGuards(JWTGuard)
	@UseGuards(HealthCheckGuard)
	@Post("delete")
	@ApiOperation({ summary: "Delete", description: "Delete a task" })
	@ApiBody({ type: TaskIdentifierDTO })
	@ApiResponse({ status: 200, description: "Task successfully deleted", example: { status: "deleted" } })
	@ApiResponse({ status: 400, description: "Error", type: StatusDTO<string> })
	@ApiResponse({ status: 401, description: "Unauthorized", type: StatusDTO })
	async deleteTask(@Req() request: Request, @Body() body: TaskIdentifierDTO): Promise<StatusDTO<void>> {
		try {
			await this.deleteTaskUseCase.execute(body.id, request.user as TokenDataDTO);
			return new StatusDTO("deleted");
		} catch (error) {
			if (error instanceof BaseError) return new StatusDTO(error.id);
			return new StatusDTO("unknown_error");
		}
	}

	/**
	 * POST /task/list
	 * Returns a paginated list of tasks for the authenticated user.
	 */
	@UseGuards(JWTGuard)
	@UseGuards(HealthCheckGuard)
	@Post("list")
	@ApiOperation({ summary: "List", description: "List tasks" })
	@ApiResponse({
		status: 200,
		description: "Tasks retrieved successfully",
		schema: {
			allOf: [
				{ $ref: getSchemaPath(StatusDTO) },
				{ properties: { data: { $ref: getSchemaPath(TaskReturnSegmentDTO) } } }
			]
		}
	})
	@ApiResponse({ status: 400, description: "Error", type: StatusDTO<string> })
	@ApiResponse({ status: 401, description: "Unauthorized", type: StatusDTO })
	async listTasks(@Req() request: Request, @Body() body: TaskFetchSegmentDTO): Promise<StatusDTO<TaskReturnSegmentDTO>> {
		try {
			const segment = await this.listTaskUseCase.execute(request.user as TokenDataDTO, body.limit, body.cursor);
			return new StatusDTO<TaskReturnSegmentDTO>("tasks", TaskReturnSegmentDTO.fromSegment(segment));
		} catch (error) {
			if (error instanceof BaseError) return new StatusDTO(error.id);
			Logger.log(error);
			return new StatusDTO("unknown_error");
		}
	}

}
