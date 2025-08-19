/**
 * Delete Task UseCase Tests
 * 
 * Tests cover:
 * - Delete existing task
 * - Refuse delete with invalid ID
 * - Refuse delete with invalid token
 * - Refuse delete non-existent task
 */

import { Test, TestingModule } from "@nestjs/testing";
import { InvalidId, InvalidToken } from "src/application/erros/auth.errors";
import { TaskNotFound } from "src/application/erros/task.error";
import { RegisterUserUseCase } from "src/application/use-cases/auth/register.usecase";
import { CreateTaskUseCase } from "src/application/use-cases/tasks/create.usecase";
import { DeleteTaskUseCase } from "src/application/use-cases/tasks/delete.usecase";
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

describe('Delete Task UseCase', () => {

	let registerUserUseCase: RegisterUserUseCase;
	let createTaskUseCase: CreateTaskUseCase;
	let deleteTaskUseCase: DeleteTaskUseCase;

	beforeEach(async () => {

		const app: TestingModule = await Test.createTestingModule({
			providers: [
				RegisterUserUseCase,
				CreateTaskUseCase,
				DeleteTaskUseCase,
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
		deleteTaskUseCase = app.get<DeleteTaskUseCase>(DeleteTaskUseCase);

	});

	it("should delete existing task", async () => {

		const user = await registerUserUseCase.execute("user@example.com", "12345678");
		const task = await createTaskUseCase.execute({
			name: "task to delete",
			notifyType: "Never"
		}, { sub: user.id, email: user.email });

		await expect(
			deleteTaskUseCase.execute(task.id, { sub: user.id, email: user.email })
		).resolves.toBeUndefined();

	});

	it("should refuse delete with invalid ID", async () => {

		const user = await registerUserUseCase.execute("user2@example.com", "12345678");

		await expect(
			deleteTaskUseCase.execute("invalid_id", { sub: user.id, email: user.email })
		).rejects.toThrow(InvalidId);

	});

	it("should refuse delete with invalid token", async () => {

		await expect(
			deleteTaskUseCase.execute("01K31DX9HCR81KKD18HXGARCVQ", {
				sub: "invalid_user",
				email: "test@example.com"
			})
		).rejects.toThrow(InvalidToken);

	});

	it("should refuse delete non-existent task", async () => {

		const user = await registerUserUseCase.execute("user3@example.com", "12345678");

		await expect(
			deleteTaskUseCase.execute("01K31DX9HCR81KKD18HXGARCVQ", {
				sub: user.id,
				email: user.email
			})
		).rejects.toThrow(TaskNotFound);

	});

});