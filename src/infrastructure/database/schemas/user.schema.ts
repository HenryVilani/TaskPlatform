import { Column, Entity, JoinColumn, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, Unique } from "typeorm";
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

	@OneToMany(() => TaskSchema, (taks) => taks.user)
	tasks: TaskSchema[];

}
