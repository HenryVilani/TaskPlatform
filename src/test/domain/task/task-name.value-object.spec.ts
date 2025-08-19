/**
 * TaskName Value Object Tests
 * 
 * Tests cover:
 * - Valid task name creation
 * - Invalid task name rejection
 * - Task name comparison
 * - Trimming functionality
 */

import { InvalidTaskName } from "src/application/erros/task.error";
import { TaskName } from "src/domain/task/task-name.value-object";

describe('TaskName Value Object', () => {

	it("should create valid task name", () => {

		const taskName = TaskName.create("Valid Task Name");
		expect(taskName.value).toBe("Valid Task Name");

	});

	it("should trim task name spaces", () => {

		const taskName = TaskName.create("  Task Name  ");
		expect(taskName.value).toBe("Task Name");

	});

	it("should reject empty task name", () => {

		expect(() => TaskName.create("")).toThrow(InvalidTaskName);
		expect(() => TaskName.create("   ")).toThrow(InvalidTaskName);

	});

	it("should reject task name too long", () => {

		const longName = "a".repeat(41);
		expect(() => TaskName.create(longName)).toThrow(InvalidTaskName);

	});

	it("should accept task name at maximum length", () => {

		const maxLengthName = "a".repeat(40);
		const taskName = TaskName.create(maxLengthName);
		expect(taskName.value).toBe(maxLengthName);

	});

	it("should compare task names correctly", () => {

		const name1 = TaskName.create("Task Name");
		const name2 = TaskName.create("Task Name");
		const name3 = TaskName.create("Different Name");

		expect(name1.equals(name2)).toBe(true);
		expect(name1.equals(name3)).toBe(false);

	});

});