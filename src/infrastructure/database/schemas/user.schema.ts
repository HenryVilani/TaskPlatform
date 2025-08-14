import { Column, Entity, OneToMany, PrimaryColumn, Unique } from "typeorm";
import { TaskSchema } from "./task.schema";

@Entity('users')
@Unique(["email"])
export class UserSchema {

	@PrimaryColumn("varchar")
	id: string;

	@Column()
	email: string;

	@Column()
	password: string;

	@Column()
	type: string;

	@OneToMany(() => TaskSchema, (taks) => taks.user)
	tasks: TaskSchema[];

}
