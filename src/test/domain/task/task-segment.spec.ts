/**
 * TaskSegment Tests
 * 
 * Tests cover:
 * - Task segment creation
 * - Cursor encoding and decoding
 * - Pagination functionality
 */

import { DateTime } from "luxon";
import { TaskSegment } from "src/domain/task/task-segment";
import { Task } from "src/domain/task/task.entity";
import { TaskName } from "src/domain/task/task-name.value-object";
import { User } from "src/domain/user/user.entity";
import { Email } from "src/domain/user/email.value-object";
import { Password } from "src/domain/user/password.value-object";

describe('TaskSegment', () => {

	let user: User;
	let tasks: Task[];

	beforeEach(async () => {

		const email = Email.create("test@example.com");
		const password = await Password.create("password123");
		user = new User("user_id", "User", email, password);

		tasks = [
			new Task(user, "task_1", TaskName.create("Task 1"), "Content 1", DateTime.now(), DateTime.now(), null, "VOID", "Never"),
			new Task(user, "task_2", TaskName.create("Task 2"), "Content 2", DateTime.now(), DateTime.now(), null, "VOID", "Never")
		];

	});

	it("should create task segment without cursor", () => {

		const segment = new TaskSegment(tasks, false);

		expect(segment.tasks).toBe(tasks);
		expect(segment.hasMore).toBe(false);
		expect(segment.cursor).toBeUndefined();

	});

	it("should create task segment with cursor", () => {

		const segment = new TaskSegment(tasks, true, "next_task_id");

		expect(segment.tasks).toBe(tasks);
		expect(segment.hasMore).toBe(true);
		expect(segment.cursor).toBeDefined();

	});

	it("should encode and decode cursor correctly", () => {

		const taskId = "test_task_id_123";
		const cursor = TaskSegment.toCursor(taskId);
		const decodedId = TaskSegment.fromCursor(cursor);

		expect(typeof cursor).toBe("string");
		expect(decodedId).toBe(taskId);

	});

	it("should handle base64 encoding", () => {

		const testId = "01K31DX9HCR81KKD18HXGARCVQ";
		const expectedBase64 = Buffer.from(testId, "utf-8").toString("base64");

		const cursor = TaskSegment.toCursor(testId);
		expect(cursor).toBe(expectedBase64);

	});

});