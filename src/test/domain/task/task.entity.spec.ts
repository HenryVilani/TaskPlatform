/**
 * Task Entity Tests
 * 
 * Tests cover:
 * - Task creation and properties
 * - Task updates
 * - Notification scheduling
 * - Status management
 */

import { DateTime } from "luxon";
import { Task } from "src/domain/task/task.entity";
import { TaskName } from "src/domain/task/task-name.value-object";
import { User } from "src/domain/user/user.entity";
import { Email } from "src/domain/user/email.value-object";
import { Password } from "src/domain/user/password.value-object";

describe('Task Entity', () => {

	let user: User;
	let task: Task;

	beforeEach(async () => {

		const email = Email.create("test@example.com");
		const password = await Password.create("password123");
		user = new User("user_id", "User", email, password);

		task = new Task(
			user,
			"task_id",
			TaskName.create("Test Task"),
			"Test content",
			DateTime.now(),
			DateTime.now(),
			null,
			"VOID",
			"Never"
		);

	});

	it("should create task with correct properties", () => {

		expect(task.id).toBe("task_id");
		expect(task.name).toBeInstanceOf(TaskName);
		expect(task.name.value).toBe("Test Task");
		expect(task.content).toBe("Test content");
		expect(task.user).toBe(user);
		expect(task.notifyStatus).toBe("VOID");
		expect(task.notifyType).toBe("Never");

	});

	it("should update task name and content", () => {

		const newName = TaskName.create("Updated Task");
		const newContent = "Updated content";
		const originalUpdatedAt = task.updatedAt;

		// Wait a bit to ensure different timestamp
		setTimeout(() => {
			task.update(newName, newContent);

			expect(task.name).toBe(newName);
			expect(task.content).toBe(newContent);
			expect(task.updatedAt.toMillis()).toBeGreaterThan(originalUpdatedAt.toMillis());
		}, 1);

	});

	it("should set job ID", () => {

		task.setJobId("job_123");
		expect(task.jobId).toBe("job_123");

	});

	it("should schedule notification", () => {

		const notifyAt = DateTime.now().plus({ hours: 1 });
		task.scheduleNotification(notifyAt, "OneTime");

		expect(task.notifyAt).toBe(notifyAt);
		expect(task.notifyType).toBe("OneTime");
		expect(task.notifyStatus).toBe("SCHEDULED");

	});

	it("should mark as sent", () => {

		task.markAsSent();
		expect(task.notifyStatus).toBe("SENT");

	});

	it("should mark as pending", () => {

		task.markAsPending();
		expect(task.notifyStatus).toBe("PENDIGN"); // Note: keeping original typo from codebase

	});

	it("should mark as scheduled", () => {

		task.markAsScheduled();
		expect(task.notifyStatus).toBe("SCHEDULED");

	});

	it("should generate new ID", () => {

		const id = Task.newId();
		expect(typeof id).toBe("string");
		expect(id.length).toBe(26); // ULID length

	});

});