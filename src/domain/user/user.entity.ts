import { UserRole } from "src/application/repositories/auth.repository";
import { Password } from "./password.value-object";
import { Email } from "./email.value-object";
import { ulid } from "ulid";
import { TUserPermissions, UserPermissions } from "./user-permisions";


export class User {
	public role: UserRole;
	public email: Email;
	public password: Password;

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

	updateEmail(newEmail: string): void {
		this.email = Email.create(newEmail);
	}

	async updatePassword(plainPassword: string): Promise<void> {
		this.password = await Password.create(plainPassword);
	}

	promoteToAdmin(): void {
		this.role = "Admin";
	}

	// Métodos de domínio
	canManageUser(targetUser: User): boolean {
		return this.role === "Admin" || this.id === targetUser.id;
	}

	hasPermission(permission: TUserPermissions): boolean {
		return UserPermissions[permission].includes(this.role);
	}

	static newId(): string {
		return ulid();
	}
}