import { Column, Entity, OneToMany, PrimaryColumn, Unique } from "typeorm";
import { TaskSchema } from "./task.schema";
import type { UserRole } from "src/application/repositories/auth.repository";

/**
 * TypeORM schema representing a User entity in the database.
 * Maps the User domain entity to database table structure.
 */
@Entity('users')
@Unique(["email"])
export class UserSchema {

	/**
	 * Unique identifier for the user
	 * @type {string}
	 */
	@PrimaryColumn("varchar")
	id: string;

	/**
	 * User's email address (must be unique)
	 * @type {string}
	 */
	@Column()
	email: string;

	/**
	 * User's hashed password
	 * @type {string}
	 */
	@Column()
	password: string;

	/**
	 * Role of the user (e.g., "User" or "Admin")
	 * @type {UserRole}
	 */
	@Column({ type: "varchar" })
	role: UserRole;

	/**
	 * Relation to tasks owned by this user.
	 * One user can have multiple tasks.
	 * @type {TaskSchema[]}
	 */
	@OneToMany(() => TaskSchema, (task) => task.user)
	tasks: TaskSchema[];

}