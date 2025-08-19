/**
 * JWT Repository Implementation Tests
 * 
 * Tests cover:
 * - Token generation
 * - Token validation
 * - User authentication
 * - User authorization
 */

import { InvalidToken } from "src/application/erros/auth.errors";
import { JWTImpl } from "src/infrastructure/auth/jwt/jwt.repository.impl";
import { User } from "src/domain/user/user.entity";
import { Email } from "src/domain/user/email.value-object";
import { Password } from "src/domain/user/password.value-object";

describe('JWT Repository Implementation', () => {

	let jwtRepository: JWTImpl;
	let user: User;

	beforeEach(async () => {

		jwtRepository = new JWTImpl();

		const email = Email.create("test@example.com");
		const password = await Password.create("password123");
		user = new User("user_id", "User", email, password);

	});

	it("should generate valid token", () => {

		const token = jwtRepository.getToken(user);

		expect(typeof token).toBe("string");
		expect(token.split('.').length).toBe(3); // JWT has 3 parts

	});

	it("should validate valid token", () => {

		const token = jwtRepository.getToken(user);
		const payload = jwtRepository.validateToken(token);

		expect(payload).toHaveProperty("sub");
		expect(payload).toHaveProperty("email");
		expect(payload.sub).toBe(user.id);

	});

	it("should reject invalid token", () => {

		expect(() => jwtRepository.validateToken("invalid.token.here"))
			.toThrow(InvalidToken);

	});

	it("should authenticate user with correct password", async () => {

		const result = await jwtRepository.authenticate(user, "password123");
		expect(result).toBe(true);

	});

	it("should reject authentication with wrong password", async () => {

		const result = await jwtRepository.authenticate(user, "wrongpassword");
		expect(result).toBe(false);

	});

	it("should authorize user with matching role", async () => {

		const result = await jwtRepository.authorize(user, "User");
		expect(result).toBe(true);

	});

	it("should reject authorization with different role", async () => {

		const result = await jwtRepository.authorize(user, "Admin");
		expect(result).toBe(false);

	});

});
