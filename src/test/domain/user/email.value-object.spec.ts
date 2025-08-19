/**
 * Email Value Object Tests
 * 
 * Tests cover:
 * - Valid email creation
 * - Invalid email rejection
 * - Email comparison
 * - Email validation rules
 */

import { EmailIsNotValid } from "src/application/erros/auth.errors";
import { Email } from "src/domain/user/email.value-object";

describe('Email Value Object', () => {

	it("should create valid email", () => {

		const email = Email.create("test@example.com");
		expect(email.value).toBe("test@example.com");

	});

	it("should trim email spaces", () => {

		const email = Email.create("  test@example.com  ");
		expect(email.value).toBe("test@example.com");

	});

	it("should reject invalid email formats", () => {

		const invalidEmails = [
			"invalid-email",
			"@example.com",
			"test@",
			"test.example.com",
			"",
			"   "
		];

		invalidEmails.forEach(invalidEmail => {
			expect(() => Email.create(invalidEmail)).toThrow(EmailIsNotValid);
		});

	});

	it("should compare emails correctly", () => {

		const email1 = Email.create("test@example.com");
		const email2 = Email.create("test@example.com");
		const email3 = Email.create("other@example.com");

		expect(email1.equals(email2)).toBe(true);
		expect(email1.equals(email3)).toBe(false);

	});

});
