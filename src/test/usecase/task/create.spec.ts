/**
 * Create Task UseCase Tests
 * 
 * Tests cover:
 * - Create a task with valid data
 * - Refuse create task with invalid name
 * - Refuse create task with invalid token
 * - Create task with notification settings
 */

import { Test, TestingModule } from "@nestjs/testing";
import { InvalidToken } from "src/application/erros/auth.errors";
import { InvalidTaskName } from "src/application/erros/task.error";
import { RegisterUserUseCase } from "src/application/use-cases/auth/register.usecase";
import { CreateTaskUseCase } from "src/application/use-cases/tasks/create.usecase";
import { Task } from "src/domain/task/task.entity";
import { User } from "src/domain/user/user.entity";
import { TaskInMemoryRepository } from "src/infrastructure/database/inMemory/task.repository.impl";
import { UserInMemoryRepository } from "src/infrastructure/database/inMemory/user.repository.impl";

// Mock scheduler repository
class MockSchedulerRepository {
	async schedule(task: Task): Promise<void> {
		// Mock implementation
	}
	async removeSchedule(jobId: string): Promise<void> {
		// Mock implementation
	}
	async updateSchedule(task: Task): Promise<void> {
		// Mock implementation
	}
	async getSchedule(jobId: string): Promise<Task | null> {
		return null;
	}
}

describe('Create Task UseCase', () => {

	let registerUserUseCase: RegisterUserUseCase;
	let createTaskUseCase: CreateTaskUseCase;

	beforeEach(async () => {

		const app: TestingModule = await Test.createTestingModule({
			providers: [
				RegisterUserUseCase,
				CreateTaskUseCase,
				{
					provide: "IUserRepository",
					useClass: UserInMemoryRepository
				},
				{
					provide: "ITaskRepository",
					useClass: TaskInMemoryRepository
				},
				{
					provide: "ISchedulerRepository",
					useClass: MockSchedulerRepository
				}
			]
		}).compile();

		registerUserUseCase = app.get<RegisterUserUseCase>(RegisterUserUseCase);
		createTaskUseCase = app.get<CreateTaskUseCase>(CreateTaskUseCase);

	});

	it("should create a task with valid data", async () => {

		const user = await registerUserUseCase.execute("user_04@gmail.com", "12345678");

		const result = await createTaskUseCase.execute({
			name: "task01",
			notifyType: "EveryTime",
			content: "Homework"
		}, { sub: user.id, email: user.email });

		expect(result).toBeInstanceOf(Task);
		expect(result.name.value).toBe("task01");
		expect(result.content).toBe("Homework");
		expect(result.notifyType).toBe("EveryTime");
		expect(result.user).toBeInstanceOf(User);

	});

	it("should refuse to create task with invalid name", async () => {

		const user = await registerUserUseCase.execute("user_05@gmail.com", "12345678");

		await expect(
			createTaskUseCase.execute({
				name: "",
				notifyType: "Never"
			}, { sub: user.id, email: user.email })
		).rejects.toThrow(InvalidTaskName);

	});

	it("should refuse to create task with invalid token", async () => {

		await expect(
			createTaskUseCase.execute({
				name: "valid task",
				notifyType: "Never"
			}, { sub: "invalid_id", email: "test@example.com" })
		).rejects.toThrow(InvalidToken);

	});

	it("should create task with notification settings", async () => {

		const user = await registerUserUseCase.execute("user_06@gmail.com", "12345678");
		const notifyAt = new Date().toISOString();

		const result = await createTaskUseCase.execute({
			name: "scheduled task",
			notifyType: "OneTime",
			content: "Important meeting",
			notifyAt: notifyAt
		}, { sub: user.id, email: user.email });

		expect(result.notifyType).toBe("OneTime");
		expect(result.notifyAt).toBeTruthy();
		expect(result.notifyStatus).toBe("SCHEDULED");

	});

});