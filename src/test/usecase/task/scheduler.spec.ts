/**
 * Scheduler Task UseCase Tests
 * 
 * Tests cover:
 * - Schedule task successfully
 * - Handle scheduler errors gracefully
 */

import { Test, TestingModule } from "@nestjs/testing";
import { DateTime } from "luxon";
import { SchedulerTaskUseCase } from "src/application/use-cases/tasks/scheduler.usecase";
import { Task } from "src/domain/task/task.entity";
import { TaskName } from "src/domain/task/task-name.value-object";
import { User } from "src/domain/user/user.entity";
import { Email } from "src/domain/user/email.value-object";
import { Password } from "src/domain/user/password.value-object";

describe('Scheduler Task UseCase', () => {

	let schedulerTaskUseCase: SchedulerTaskUseCase;
	let mockSchedulerRepository: jest.Mocked<any>;

	beforeEach(async () => {

		mockSchedulerRepository = {
			schedule: jest.fn(),
			removeSchedule: jest.fn(),
			updateSchedule: jest.fn(),
			getSchedule: jest.fn()
		};

		const app: TestingModule = await Test.createTestingModule({
			providers: [
				SchedulerTaskUseCase,
				{
					provide: "ISchedulerRepository",
					useValue: mockSchedulerRepository
				}
			]
		}).compile();

		schedulerTaskUseCase = app.get<SchedulerTaskUseCase>(SchedulerTaskUseCase);

	});

	it("should schedule task successfully", async () => {

		const mockUser = new User(
			"user_id",
			"User",
			Email.create("test@example.com"),
			new Password("hashedPassword")
		);

		const task = new Task(
			mockUser,
			"task_id",
			TaskName.create("Test Task"),
			"Test content",
			DateTime.now(),
			DateTime.now(),
			DateTime.now().plus({ hours: 1 }),
			"SCHEDULED",
			"OneTime"
		);

		mockSchedulerRepository.schedule.mockResolvedValue(undefined);

		await expect(
			schedulerTaskUseCase.execute(task)
		).resolves.toBeUndefined();

		expect(mockSchedulerRepository.schedule).toHaveBeenCalledWith(task);

	});

});