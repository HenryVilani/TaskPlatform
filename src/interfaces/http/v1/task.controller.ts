import { Body, Controller, Get, Logger, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { type Request } from "express";
import { ITokenDataInDTO } from "../../../application/dtos/input/token.in.dto";
import { InvalidSession } from "src/application/erros/auth.errors";
import { StatusOutDTO } from "src/application/dtos/output/status.out.dto";
import { CreateTaskUseCase } from "src/application/use-cases/tasks/create.usecase";
import { UpdateTaskUseCase } from "src/application/use-cases/tasks/update.usecase";
import { DeleteTaskUseCase } from "src/application/use-cases/tasks/delete.usecase";
import { type ICreateTaskControllerDTO, type IOutTaskControllerDTO, type IInTaskControllerDTO, type IInDelteTaskControllerDTO } from "./dtos/task.dto";
import { ListTaskUseCase } from "src/application/use-cases/tasks/list.usecase";
import { BaseError } from "src/application/erros/base.errors";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { documentation_CreateTaskControllerDTO, documentation_IInDelteTaskControllerDTO, documentation_IInTaskControllerDTO } from "./documentation/dto.input";

//@ApiTags("Task")
@Controller("task")
export class TaskController {

    constructor (
		private readonly createTaskUseCase: CreateTaskUseCase,
		private readonly updateTaskUseCase: UpdateTaskUseCase,
		private readonly deleteTaskUseCase: DeleteTaskUseCase,
		private readonly listTaskUseCase: ListTaskUseCase,
	) {}


	@UseGuards(AuthGuard('jwt'))
	@Post("create")
	@ApiOperation({ summary: "Create a new task" })
	@ApiBody({ type: documentation_CreateTaskControllerDTO })
	@ApiResponse({ status: 201, description: "Task successfully created", type: StatusOutDTO })
	@ApiResponse({ status: 401, description: "Invalid token or expired session", type: InvalidSession })
	@ApiResponse({ status: 500, description: "Unknown error" })
	async createTask(@Req() request: Request, @Body() body: ICreateTaskControllerDTO) {

		try {

			const task = await this.createTaskUseCase.execute(body.name, request.user as ITokenDataInDTO);

			return new StatusOutDTO<IOutTaskControllerDTO>("created", {
				id: task.id,
				name: task.name.validatedName,
				content: task.content,
				createdAt: task.createdAt.toISO()!,
				updatedAt: task.updatedAt.toISO()!,
				notifyAt: task.notifyAt?.toISO() ?? null,
				
			})
			

		}catch (error) {

			if (error instanceof InvalidSession) {

				return new StatusOutDTO(error.responseMessage).toDict();

			}else {

				Logger.log(error)
				return new StatusOutDTO("unknown_error").toDict();

			}

		}


	}

	@UseGuards(AuthGuard('jwt'))
	@Post("update")
	@ApiOperation({ summary: "Update an existing task" })
	@ApiBody({ type: documentation_IInTaskControllerDTO })
	@ApiResponse({ status: 200, description: "Task successfully updated", type: StatusOutDTO })
	@ApiResponse({ status: 401, description: "Invalid token or expired session" })
	@ApiResponse({ status: 500, description: "Unknown error" })
	async updateTask(@Req() request: Request, @Body() body: IInTaskControllerDTO) {

		try {

			const task = await this.updateTaskUseCase.execute({
				...body
			}, request.user as ITokenDataInDTO);

			return new StatusOutDTO<IOutTaskControllerDTO>("updated", {
				id: task.id,
				name: task.name.validatedName,
				content: task.content,
				createdAt: task.createdAt.toISO()!,
				updatedAt: task.updatedAt.toISO()!,
				notifyAt: task.notifyAt?.toISO() ?? null,
				
			});
			

		}catch (error) {

			if (error instanceof InvalidSession) {

				return new StatusOutDTO(error.responseMessage).toDict();

			}else {

				Logger.log(error)
				return new StatusOutDTO("unknown_error").toDict();

			}

		}

	}

	@UseGuards(AuthGuard('jwt'))
	@Post("delete")
	@ApiOperation({ summary: "Delete a task" })
	@ApiBody({ type: documentation_IInDelteTaskControllerDTO })
	@ApiResponse({ status: 200, description: "Task successfully deleted", type: StatusOutDTO })
	@ApiResponse({ status: 401, description: "Invalid token or expired session" })
	@ApiResponse({ status: 500, description: "Unknown error" })
	async deleteTask(@Req() request: Request, @Body() body: IInDelteTaskControllerDTO) {

		try {

			const task = await this.deleteTaskUseCase.execute(body.id, request.user as ITokenDataInDTO);
			

		}catch (error) {

			if (error instanceof BaseError) {

				return new StatusOutDTO(error.responseMessage).toDict();

			}else {

				Logger.log(error)
				return new StatusOutDTO("unknown_error").toDict();

			}

		}

	}

	@UseGuards(AuthGuard('jwt'))
	@Get("list")
	async getAllTasks(@Req() request: Request) {

		try {

			const tasks = await this.listTaskUseCase.execute(request.user as ITokenDataInDTO);

			return tasks.map(task => {

				return {

					id: task.id,
					name: task.name.validatedName,
					content: task.content,
					createdAt: task.createdAt.toISO()!,
					updatedAt: task.updatedAt.toISO()!,
					notifyAt: task.notifyAt ? task.notifyAt.toISO()! : null

				} as IOutTaskControllerDTO;

			})


		}catch (error) {

			if (error instanceof BaseError) {

				return new StatusOutDTO(error.responseMessage).toDict();

			}else {

				Logger.log(error)
				return new StatusOutDTO("unknown_error").toDict();

			}

		}

	}

}
