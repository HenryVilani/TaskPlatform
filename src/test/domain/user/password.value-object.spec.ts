/**
 * Password Value Object Tests
 * 
 * Tests cover:
 * - Valid password creation and hashing
 * - Invalid password rejection
 * - Password verification
 * - Password comparison
 */

import { PasswordIsNotValid } from "src/application/erros/auth.errors";
import { Password } from "src/domain/user/password.value-object";

describe('Password Value Object', () => {

	it("should create and hash valid password", async () => {

		const password = await Password.create("validpassword123");

		expect(password.value).toBeDefined();
		expect(password.value).not.toBe("validpassword123"); // Should be hashed
		expect(password.plain).toBe("validpassword123");

	});

	it("should reject password too short", async () => {

		await expect(Password.create("1234567")).rejects.toThrow(PasswordIsNotValid);

	});

	it("should reject password too long", async () => {

		const longPassword = "a".repeat(36);
		await expect(Password.create(longPassword)).rejects.toThrow(PasswordIsNotValid);

	});

	it("should reject password with spaces", async () => {

		await expect(Password.create("password with spaces")).rejects.toThrow(PasswordIsNotValid);

	});

	it("should verify password correctly", async () => {

		const password = await Password.create("testpassword123");

		expect(await password.verify("testpassword123")).toBe(true);
		expect(await password.verify("wrongpassword")).toBe(false);

	});

	it("should compare passwords correctly", async () => {

		const password1 = await Password.create("samepassword");
		const password2 = await Password.create("samepassword");
		const password3 = await Password.create("differentpassword");

		// Different instances with same password should not be equal (different hashes)
		expect(password1.equals(password2)).toBe(false);
		expect(password1.equals(password3)).toBe(false);

	});

});