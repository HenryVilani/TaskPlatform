import { UserRole } from "src/application/repositories/auth.repository";
import { Password } from "./password.value-object";
import { Email } from "./email.value-object";
import { ulid } from "ulid";
import { TUserPermissions, UserPermissions } from "./user-permisions";



export class User {

	constructor(
		private readonly _id: string,
		private _role: UserRole,
		private _email: Email,
		private _password: Password
	) { }

	get id(): string {
		return this._id;
	}

	get role(): UserRole {
		return this._role;
	}

	get email(): Email {
		return this._email;
	}

	get password(): Password {
		return this._password;
	}

	updateEmail(newEmail: string): void {
		this._email = Email.create(newEmail);
	}

	async updatePassword(plainPassword: string): Promise<void> {

		this._password = await Password.create(plainPassword);

	}

	promoteToAdmin(): void {
		this._role = "Admin";
	}

	// Métodos de domínio
	canManageUser(targetUser: User): boolean {
		return this._role === "Admin" || this._id === targetUser.id;
	}

	hasPermission(permission: TUserPermissions): boolean {

		return UserPermissions[permission].includes(this.role);

	}

	static newId(): string {

		return ulid();

	}

}
