import { User } from "src/domain/user/user.entity";

/**
 * Defines the possible roles a user can have.
 */
export type UserRole = "User" | "Admin";

/**
 * Interface for authentication-related repository operations.
 */
export interface IAuthRepository {
	/**
	 * Generates a token (e.g., JWT) for the given user.
	 * @param user The user entity for which to generate the token.
	 * @returns A string representing the generated token.
	 */
	getToken(user: User): string;

	/**
	 * Validates a given token.
	 * @param token The token to validate.
	 * @returns Returns token payload if valid, or any relevant validation result.
	 */
	validateToken(token: string): any;

	/**
	 * Authenticates a user by checking their credentials.
	 * @param user The user entity to authenticate.
	 * @param tryPassword The password provided for authentication.
	 * @returns A promise that resolves to `true` if authentication succeeds, `false` otherwise.
	 */
	authenticate(user: User, tryPassword: string): Promise<boolean>;

	/**
	 * Authorizes a user for a specific role or permission.
	 * @param user The user entity to authorize.
	 * @param flag The role or permission to check.
	 * @returns A promise that resolves to `true` if the user is authorized, `false` otherwise.
	 */
	authorize(user: User, flag: UserRole): Promise<boolean>;
}
