/**
 * Create Task UseCase Tests
 * 
 * - Create a task
 * - Refuse create task with invalid name
 * 
 */

import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { Test, TestingModule } from "@nestjs/testing"
import { DateTime } from "luxon";
import { InvalidTaskName } from "src/application/erros/task.error";
import { RegisterUserUseCase } from "src/application/use-cases/auth/register.usecase";
import { CreateTaskUseCase } from "src/application/use-cases/tasks/create.usecase";
import { Task, TaskName } from "src/domain/task.domain";
import { User } from "src/domain/user.domain";
import { TaskInMemoryRepository } from "src/infrastructure/database/inMemory/task.repository.impl";
import { UserInMemoryRepository } from "src/infrastructure/database/inMemory/user.repository.impl";


describe('Create Task UseCase', () => {

	let registerUserUseCase: RegisterUserUseCase;
	let createTaskUsecase: CreateTaskUseCase;

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

	});

	it("Create a task", async () => {

		const anyOrNull = (type: any) => expect.anything() && {
			asymmetricMatch: (val: any) => val === null || val instanceof type,
		  };

		const user = await registerUserUseCase.execute("user_04@gmail.com", "12345678");

		await expect(createTaskUsecase.execute("task01", {sub: user.id, email: user.email})).resolves.toMatchObject<Task>({
			user: expect.any(User),
			id: expect.any(String),
			name: expect.any(TaskName),
			content: expect.any(String),
			createdAt: expect.any(DateTime),
			updatedAt: expect.any(DateTime),
			notifyAt: anyOrNull(DateTime),
		})

	});

	it("Refuse create task with invalid name", async () => {

		const anyOrNull = (type: any) => expect.anything() && {
			asymmetricMatch: (val: any) => val === null || val instanceof type,
		  };

		const user = await registerUserUseCase.execute("user_05@gmail.com", "12345678");

		await expect(createTaskUsecase.execute("", {sub: user.id, email: user.email})).rejects.toThrow(InvalidTaskName);

	});

})
