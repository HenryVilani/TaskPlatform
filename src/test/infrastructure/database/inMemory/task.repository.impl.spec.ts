/**
 * Task In-Memory Repository Tests
 * 
 * Tests cover:
 * - Task CRUD operations
 * - Task pagination
 * - User-specific task filtering
 * - Error handling
 */

import { DateTime } from "luxon";
import { TaskInMemoryRepository } from "src/infrastructure/database/inMemory/task.repository.impl";
import { Task } from "src/domain/task/task.entity";
import { TaskName } from "src/domain/task/task-name.value-object";
import { TaskSegment } from "src/domain/task/task-segment";
import { User } from "src/domain/user/user.entity";
import { Email } from "src/domain/user/email.value-object";
import { Password } from "src/domain/user/password.value-object";
import { TaskNotFound } from "src/application/erros/task.error";

describe('Task In-Memory Repository', () => {

	let repository: TaskInMemoryRepository;
	let user1: User;
	let user2: User;

	beforeEach(async () => {

		repository = new TaskInMemoryRepository();

		const email1 = Email.create("user1@example.com");
		const email2 = Email.create("user2@example.com");
		const password = await Password.create("password123");

		user1 = new User(User.newId(), "User", email1, password);
		user2 = new User(User.newId(), "User", email2, password);

	});

	it("should create task successfully", async () => {

		const tempTask = new Task(
			user1,
			Task.newId(),
			TaskName.create("Test Task"),
			"Test content",
			DateTime.now(),
			DateTime.now(),
			null,
			"VOID",
			"Never"
		);

		const result = await repository.create(user1, tempTask);
		expect(result).toBe(tempTask);

	});

	it("should find task by ID for correct user", async () => {

		const tempTask = new Task(
			user2,
			Task.newId(),
			TaskName.create("Test Task"),
			"Test content",
			DateTime.now(),
			DateTime.now(),
			null,
			"VOID",
			"Never"
		);

		const reuslt = await repository.create(user2, tempTask);
		const found = await repository.findById(user2, tempTask.id);

		expect(found).toBe(reuslt);

	});

	it("should not find task for different user", async () => {

		const tempTask = new Task(
			user2,
			Task.newId(),
			TaskName.create("Test Task"),
			"Test content",
			DateTime.now(),
			DateTime.now(),
			null,
			"VOID",
			"Never"
		);

		await repository.create(user2, tempTask);
		const found = await repository.findById(user1, tempTask.id);

		expect(found).toBeNull();

	});

	it("should find all tasks by user", async () => {

		const tempTask1 = new Task(
			user1,
			Task.newId(),
			TaskName.create("Test Task"),
			"Test content",
			DateTime.now(),
			DateTime.now(),
			null,
			"VOID",
			"Never"
		);

		const tempTask2 = new Task(
			user1,
			Task.newId(),
			TaskName.create("Test Task"),
			"Test content",
			DateTime.now(),
			DateTime.now(),
			null,
			"VOID",
			"Never"
		);

		await repository.create(user1, tempTask1);
		await repository.create(user1, tempTask2);

		const tasks = await repository.findAllByUser(user1);
		expect(tasks).toContain(tempTask1);
		expect(tasks).toContain(tempTask2);

	});

	it("should update task successfully", async () => {

		const tempTask = new Task(
			user1,
			Task.newId(),
			TaskName.create("Test Task"),
			"Test content",
			DateTime.now(),
			DateTime.now(),
			null,
			"VOID",
			"Never"
		);

		await repository.create(user1, tempTask);

		tempTask.update(TaskName.create("Updated Name"), "Updated Content");

		const result = await repository.update(user1, tempTask);
		expect(result).toBe(tempTask);

	});

	it("should delete task successfully", async () => {

		const tempTask = new Task(
			user1,
			Task.newId(),
			TaskName.create("Test Task"),
			"Test content",
			DateTime.now(),
			DateTime.now(),
			null,
			"VOID",
			"Never"
		);

		await repository.create(user1, tempTask);
		await repository.delete(user1, tempTask);

		const found = await repository.findById(user1, tempTask.id);
		expect(found).toBeNull();

	});

	it("should handle pagination correctly", async () => {

		// Create multiple tasks
		for (let i = 0; i < 5; i++) {
			const taskItem = new Task(
				user1, `task_${i}`, TaskName.create(`Task ${i}`), `Content ${i}`,
				DateTime.now(), DateTime.now(), null, "VOID", "Never"
			);
			await repository.create(user1, taskItem);
		}

		const segment = await repository.getAllBySegment(user1, 3);

		expect(segment).toBeInstanceOf(TaskSegment);
		expect(segment.tasks).toHaveLength(3);
		expect(segment.hasMore).toBe(true);
		expect(segment.cursor).toBeDefined();

	});

	it("should throw error when updating nonexistent task", async () => {

		// declare but not save in db
		const tempTask = new Task(
			user1,
			Task.newId(),
			TaskName.create("Test Task"),
			"Test content",
			DateTime.now(),
			DateTime.now(),
			null,
			"VOID",
			"Never"
		);

		await expect(repository.update(user1, tempTask))
			.rejects.toThrow(TaskNotFound);

	});

});