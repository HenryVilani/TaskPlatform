import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, PrimaryGeneratedColumn, Unique } from "typeorm";
import { UserSchema } from "./user.schema";
import { type TaskNotifyStatus } from "src/domain/task/task.entity";

@Entity('tasks')
export class TaskSchema {

	@PrimaryColumn("varchar")
	id: string;

	@Column()
	name: string;

	@Column()
	content: string;

	@Column()
	created_at: string;

	@Column()
	updated_at: string;
	
	@Column({type: "varchar", nullable: true})
	notify_at: string | null;

	@Column({type: "varchar", nullable: true})
	notify_status: TaskNotifyStatus;

	@Column({type: "varchar", nullable: true})
	notify_type: string;

	@ManyToOne(() => UserSchema, (user) => user.tasks, {onDelete: "CASCADE"})
	@JoinColumn({name: "user_id"})
	user: UserSchema;

	@Column()
	user_id: string;

}
