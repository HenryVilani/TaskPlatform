/**
 * List Tasks UseCase Tests
 * 
 * Tests cover:
 * - List tasks with valid parameters
 * - Refuse list with invalid token
 * - Refuse list with invalid limit
 * - List tasks with pagination
 */

import { Test, TestingModule } from "@nestjs/testing";
import { InvalidToken } from "src/application/erros/auth.errors";
import { TaskLimitExceeded } from "src/application/erros/task.error";
import { RegisterUserUseCase } from "src/application/use-cases/auth/register.usecase";
import { CreateTaskUseCase } from "src/application/use-cases/tasks/create.usecase";
import { ListTaskUseCase } from "src/application/use-cases/tasks/list.usecase";
import { TaskSegment } from "src/domain/task/task-segment";
import { Task } from "src/domain/task/task.entity";
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

describe('List Tasks UseCase', () => {

	let registerUserUseCase: RegisterUserUseCase;
	let createTaskUseCase: CreateTaskUseCase;
	let listTaskUseCase: ListTaskUseCase;

	beforeEach(async () => {

		const app: TestingModule = await Test.createTestingModule({
			providers: [
				RegisterUserUseCase,
				CreateTaskUseCase,
				ListTaskUseCase,
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
		listTaskUseCase = app.get<ListTaskUseCase>(ListTaskUseCase);

	});

	it("should list tasks with valid parameters", async () => {

		const user = await registerUserUseCase.execute("user@example.com", "12345678");

		// Create some tasks
		await createTaskUseCase.execute({
			name: "task 1",
			notifyType: "Never"
		}, { sub: user.id, email: user.email });

		await createTaskUseCase.execute({
			name: "task 2",
			notifyType: "Never"
		}, { sub: user.id, email: user.email });

		const result = await listTaskUseCase.execute(
			{ sub: user.id, email: user.email },
			10
		);

		expect(result).toBeInstanceOf(TaskSegment);
		expect(result.tasks).toHaveLength(2);
		expect(result.hasMore).toBe(false);

	});

	it("should refuse list with invalid token", async () => {

		await expect(
			listTaskUseCase.execute({ sub: "invalid", email: "test@example.com" }, 10)
		).rejects.toThrow(InvalidToken);

	});

	it("should refuse list with invalid limit", async () => {

		const user = await registerUserUseCase.execute("user2@example.com", "12345678");

		// Test limit too high
		await expect(
			listTaskUseCase.execute({ sub: user.id, email: user.email }, 100)
		).rejects.toThrow(TaskLimitExceeded);

		// Test negative limit
		await expect(
			listTaskUseCase.execute({ sub: user.id, email: user.email }, -1)
		).rejects.toThrow(TaskLimitExceeded);

	});

});