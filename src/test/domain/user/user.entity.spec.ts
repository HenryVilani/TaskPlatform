/**
 * User Entity Tests
 * 
 * Tests cover:
 * - User creation and properties
 * - Email and password updates
 * - Permission checks
 * - User management capabilities
 */

import { User } from "src/domain/user/user.entity";
import { Email } from "src/domain/user/email.value-object";
import { Password } from "src/domain/user/password.value-object";

describe('User Entity', () => {

	let user: User;
	let email: Email;
	let password: Password;

	beforeEach(async () => {

		email = Email.create("test@example.com");
		password = await Password.create("password123");
		user = new User("user_id", "User", email, password);

	});

	it("should create user with correct properties", () => {

		expect(user.id).toBe("user_id");
		expect(user.role).toBe("User");
		expect(user.email).toBe(email);
		expect(user.password).toBe(password);

	});

	it("should update email successfully", () => {

		const newEmail = "newemail@example.com";
		user.updateEmail(newEmail);

		expect(user.email.value).toBe(newEmail);

	});

	it("should update password successfully", async () => {

		const newPassword = "newpassword123";
		await user.updatePassword(newPassword);

		expect(user.password).toBeInstanceOf(Password);
		// Password should be different after update (new hash)
		expect(user.password).not.toBe(password);

	});

	it("should promote user to admin", () => {

		user.promoteToAdmin();
		expect(user.role).toBe("Admin");

	});

	it("should check user management permissions correctly", () => {

		const anotherUser = new User("another_id", "User", email, password);
		const adminUser = new User("admin_id", "Admin", email, password);

		// User can manage themselves
		expect(user.canManageUser(user)).toBe(true);

		// User cannot manage other users
		expect(user.canManageUser(anotherUser)).toBe(false);

		// Admin can manage any user
		expect(adminUser.canManageUser(user)).toBe(true);
		expect(adminUser.canManageUser(anotherUser)).toBe(true);

	});

	it("should check permissions correctly", () => {

		const adminUser = new User("admin_id", "Admin", email, password);

		// Both User and Admin should have server.health permission
		expect(user.hasPermission("server.health")).toBe(true);
		expect(adminUser.hasPermission("server.health")).toBe(true);

	});

	it("should generate new ID", () => {

		const id = User.newId();
		expect(typeof id).toBe("string");
		expect(id.length).toBe(26); // ULID length

	});

});