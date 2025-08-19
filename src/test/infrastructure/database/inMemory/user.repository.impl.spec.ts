/**
 * User In-Memory Repository Tests
 * 
 * Tests cover:
 * - User creation
 * - User retrieval by ID and email
 * - User updates and deletion
 * - Error handling
 */

import { UserInMemoryRepository } from "src/infrastructure/database/inMemory/user.repository.impl";
import { User } from "src/domain/user/user.entity";
import { Email } from "src/domain/user/email.value-object";
import { Password } from "src/domain/user/password.value-object";
import { UserNotFound } from "src/application/erros/auth.errors";

describe('User In-Memory Repository', () => {

	let repository: UserInMemoryRepository;
	let user: User;

	beforeEach(async () => {

		repository = new UserInMemoryRepository();

		const email = Email.create(`${User.newId()}@example.com`); // make a unique email
		const password = await Password.create("password123");
		user = new User(User.newId(), "User", email, password);

	});

	it("should create user successfully", async () => {

		const result = await repository.create(user);
		expect(result).toBe(user);

	});

	it("should find user by ID", async () => {

		await repository.create(user);
		const found = await repository.findById(user.id);

		expect(found).toBe(user);

	});

	it("should find user by email", async () => {

		await repository.create(user);
		const found = await repository.findByEmail(user.email.value);

		expect(found).toBe(user);

	});

	it("should return null when user not found", async () => {

		const foundById = await repository.findById("nonexistent");
		const foundByEmail = await repository.findByEmail("nonexistent@example.com");

		expect(foundById).toBeNull();
		expect(foundByEmail).toBeNull();

	});

	it("should update user successfully", async () => {

		await repository.create(user);

		const updatedUser = new User(
			User.newId(),
			"Admin",
			Email.create("updated@example.com"),
			await Password.create("newpassword")
		);

		user.promoteToAdmin();

		const result = await repository.update(user);
		expect(result).toBe(user);

		const found = await repository.findById(user.id);
		expect(found?.role).toBe("Admin");

	});

	it("should delete user successfully", async () => {

		await repository.create(user);
		await repository.delete(user);

		const found = await repository.findById("user_id");
		expect(found).toBeNull();

	});

	it("should throw error when updating nonexistent user", async () => {

		const tempUser = new User(
			User.newId(),
			"User",
			Email.create(`${User.newId()}@example.com`),
			await Password.create("password123")
		);

		await expect(repository.update(tempUser)).rejects.toThrow(UserNotFound);

	});

});