import { IAuthRepository, UserRole } from "src/application/repositories/auth.repository";
import argon2 from "argon2";
import jsonwebtoken from "jsonwebtoken";
import { InvalidToken } from "src/application/erros/auth.errors";
import { Injectable } from "@nestjs/common";
import { User } from "src/domain/user/user.entity";
import { Password } from "src/domain/user/password.value-object";

/**
 * Implementation of IAuthRepository using JWT for authentication and authorization.
 */
@Injectable()
export class JWTImpl implements IAuthRepository {
	/**
	 * Secret key used to sign and verify JWT tokens
	 * @private
	 * @readonly
	 * @type {string}
	 */
	private readonly secret = process.env.JWT_SECRET || "secret";

	/**
	 * Authenticates a user by verifying the provided password.
	 * @param {User} user - The user entity to authenticate.
	 * @param {string} tryPassword - The plain password to verify.
	 * @returns {Promise<boolean>} True if the password is correct, false otherwise.
	 */
	async authenticate(user: User, tryPassword: string): Promise<boolean> {
		const validPassword = await Password.create(tryPassword);
		return await argon2.verify(user.password.value, validPassword.plain);
	}

	/**
	 * Checks if the user has the required role.
	 * @param {User} user - The user entity.
	 * @param {UserRole} role - The role to check against.
	 * @returns {Promise<boolean>} True if the user's role matches, false otherwise.
	 */
	async authorize(user: User, role: UserRole): Promise<boolean> {
		return user.role == role;
	}

	/**
	 * Generates a JWT token for the user.
	 * @param {User} user - The user entity.
	 * @returns {string} A signed JWT string containing the user's id and email.
	 */
	getToken(user: User): string {
		const payload = {
			sub: user.id,
			email: user.email
		};
		return jsonwebtoken.sign(payload, this.secret);
	}

	/**
	 * Validates a JWT token.
	 * @param {string} token - The JWT string to validate.
	 * @returns {any} The decoded payload if the token is valid.
	 * @throws {InvalidToken} If the token is invalid or expired.
	 */
	validateToken(token: string): any {
		try {
			return jsonwebtoken.verify(token, this.secret);
		} catch (error) {
			throw new InvalidToken();
		}
	}
}