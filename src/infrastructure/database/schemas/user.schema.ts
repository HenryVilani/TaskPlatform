import { Column, Entity, OneToMany, PrimaryColumn, Unique } from "typeorm";
import { TaskSchema } from "./task.schema";
import type { UserRole } from "src/application/repositories/auth.repository";

/**
 * TypeORM schema representing a User entity in the database.
 */
@Entity('users')
@Unique(["email"])
export class UserSchema {

	/** Unique identifier for the user */
	@PrimaryColumn("varchar")
	id: string;

	/** User's email address (must be unique) */
	@Column()
	email: string;

	/** User's hashed password */
	@Column()
	password: string;

	/** Role of the user (e.g., "User" or "Admin") */
	@Column({ type: "varchar" })
	role: UserRole;

	/**
	 * Relation to tasks owned by this user.
	 * One user can have multiple tasks.
	 */
	@OneToMany(() => TaskSchema, (task) => task.user)
	tasks: TaskSchema[];

}
