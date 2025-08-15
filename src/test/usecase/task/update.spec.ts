/**
 * Update Task UseCase Tests
 * 
 * - Update a task
 * - Refuse update a nonexistent task
 * 
 */

import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { Test, TestingModule } from "@nestjs/testing"
import { DateTime } from "luxon";
import { TaskNotFound } from "src/application/erros/task.error";
import { RegisterUserUseCase } from "src/application/use-cases/auth/register.usecase";
import { CreateTaskUseCase } from "src/application/use-cases/tasks/create.usecase";
import { UpdateTaskUseCase } from "src/application/use-cases/tasks/update.usecase";
import { Task, TaskName } from "src/domain/task/task.entity";
import { User } from "src/domain/user.entity";
import { TaskInMemoryRepository } from "src/infrastructure/database/inMemory/task.repository.impl";
import { UserInMemoryRepository } from "src/infrastructure/database/inMemory/user.repository.impl";


describe('Update Task UseCase', () => {

	let registerUserUseCase: RegisterUserUseCase;
	let createTaskUsecase: CreateTaskUseCase;
	let updateTaskUseCase: UpdateTaskUseCase;

	beforeEach(async () => {

		let app: TestingModule = await Test.createTestingModule({
			controllers: [],
			providers: [
				{
					provide: "IUserRepository",
					useClass: UserInMemoryRepository
				},
				{
					provide: "ITaskRepository",
					useClass: TaskInMemoryRepository
				},
				RegisterUserUseCase,
				CreateTaskUseCase,
				UpdateTaskUseCase,
			],
			imports: [

				PassportModule,
				JwtModule.register({
					secret: process.env.JWT_SECRET ?? "secret",
					signOptions: {expiresIn: '1h'}
				})

			]
		}).compile();
		registerUserUseCase = app.get<RegisterUserUseCase>(RegisterUserUseCase);
		createTaskUsecase = app.get<CreateTaskUseCase>(CreateTaskUseCase);
		updateTaskUseCase = app.get<UpdateTaskUseCase>(UpdateTaskUseCase);

	});

	it("Update a task", async () => {

		const anyOrNull = (type: any) => expect.anything() && {
			asymmetricMatch: (val: any) => val === null || val instanceof type,
		  };

		const user = await registerUserUseCase.execute("user_05@gmail.com", "12345678");
		const task = await createTaskUsecase.execute("task01", {sub: user.id, email: user.email});

		await expect(updateTaskUseCase.execute({
			id: task.id,
			name: "TASK RENAMED",
			content: "CONTENT CHANGED",
			createdAt: task.createdAt.toISO()!,
			updatedAt: DateTime.now().toISO()!,
			notifyAt: DateTime.now().plus({days: 1}).toISO()!
		}, {
			sub: user.id, 
			email: user.email
		})).resolves.toMatchObject<Task>({
			content: expect.any(String),
			createdAt: expect.any(DateTime),
			id: expect.any(String),
			name: expect.any(TaskName),
			updatedAt: expect.any(DateTime),
			notifyAt: anyOrNull(DateTime),
			user: expect.any(User)
		})

	});

	it("Refuse update a nonexistent task", async () => {

		const anyOrNull = (type: any) => expect.anything() && {
			asymmetricMatch: (val: any) => val === null || val instanceof type,
		};


		const user = await registerUserUseCase.execute("user_06@gmail.com", "12345678");
		const task = await createTaskUsecase.execute("task01", {sub: user.id, email: user.email});

		task.name = await new TaskName("TASK RENAMED").validate();

		await expect(updateTaskUseCase.execute({
			id: "01K2FQ11DVVHNTF6A2R849X6D5",
			name: "TASK RENAMED",
			content: "CONTENT CHANGED",
			createdAt: task.createdAt.toISO()!,
			updatedAt: DateTime.now().toISO()!,
			notifyAt: DateTime.now().plus({days: 1}).toISO()!
		}, {
			sub: user.id, 
			email: user.email
		})).rejects.toThrow(TaskNotFound);

	});


})
