import { Column, Entity, OneToMany, PrimaryColumn, Unique } from "typeorm";
import { TaskSchema } from "./task.schema";
import type { UserRole } from "src/application/repositories/auth.repository";

@Entity('users')
@Unique(["email"])
export class UserSchema {

	@PrimaryColumn("varchar")
	id: string;

	@Column()
	email: string;

	@Column()
	password: string;

	@Column({type: "varchar"})
	role: UserRole;

	@OneToMany(() => TaskSchema, (taks) => taks.user)
	tasks: TaskSchema[];

}
