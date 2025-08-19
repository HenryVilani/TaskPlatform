import { UserRole } from "src/application/repositories/auth.repository";
import { Password } from "./password.value-object";
import { Email } from "./email.value-object";
import { ulid } from "ulid";
import { TUserPermissions, UserPermissions } from "./user-permisions";

/**
 * Entity representing a system user.
 */
export class User {
	/** Role assigned to the user */
	public role: UserRole;

	/** User's email as a value object */
	public email: Email;

	/** User's password as a value object */
	public password: Password;

	/**
	 * Creates a new User instance.
	 * @param id Unique identifier of the user.
	 * @param role Role assigned to the user.
	 * @param email User's email address.
	 * @param password User's hashed password.
	 */
	constructor(
		public readonly id: string,
		role: UserRole,
		email: Email,
		password: Password
	) {
		this.role = role;
		this.email = email;
		this.password = password;
	}

	/**
	 * Updates the user's email address.
	 * @param newEmail The new email string to set.
	 */
	updateEmail(newEmail: string): void {
		this.email = Email.create(newEmail);
	}

	/**
	 * Updates the user's password.
	 * @param plainPassword The new plain password to hash and set.
	 */
	async updatePassword(plainPassword: string): Promise<void> {
		this.password = await Password.create(plainPassword);
	}

	/**
	 * Promotes the user to an Admin role.
	 */
	promoteToAdmin(): void {
		this.role = "Admin";
	}

	/**
	 * Determines if this user can manage a target user.
	 * @param targetUser The user to check management permissions against.
	 * @returns True if the user is an Admin or is managing themselves, false otherwise.
	 */
	canManageUser(targetUser: User): boolean {
		return this.role === "Admin" || this.id === targetUser.id;
	}

	/**
	 * Checks if the user has a specific permission.
	 * @param permission The permission to check.
	 * @returns True if the user's role includes the permission, false otherwise.
	 */
	hasPermission(permission: TUserPermissions): boolean {
		return UserPermissions[permission].includes(this.role);
	}

	/**
	 * Generates a new unique ID for a user.
	 * @returns A ULID string.
	 */
	static newId(): string {
		return ulid();
	}
}
