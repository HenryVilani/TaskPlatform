import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { UserSchema } from "./user.schema";
import { type TaskNotifyType, type TaskNotifyStatus } from "src/domain/task/task.entity";

/**
 * TypeORM schema representing a Task entity in the database.
 */
@Entity('tasks')
export class TaskSchema {

	/** Unique identifier for the task */
	@PrimaryColumn("varchar")
	id: string;

	/** Optional job ID for scheduled tasks */
	@Column()
	jobId: string;

	/** Name/title of the task */
	@Column()
	name: string;

	/** Content or description of the task */
	@Column()
	content: string;

	/** Task creation timestamp in ISO string format */
	@Column()
	created_at: string;

	/** Task last update timestamp in ISO string format */
	@Column()
	updated_at: string;

	/** Scheduled notification time, if any */
	@Column({ type: "varchar", nullable: true })
	notify_at: string | null;

	/** Status of the notification (e.g., PENDING, SENT, SCHEDULED, VOID) */
	@Column({ type: "varchar", nullable: true })
	notify_status: TaskNotifyStatus;

	/** Notification type (e.g., EveryTime, OneTime, Never) */
	@Column({ type: "varchar", nullable: true })
	notify_type: TaskNotifyType;

	/**
	 * Relation to the User who owns the task.
	 * On deletion of the user, all related tasks are deleted (CASCADE).
	 */
	@ManyToOne(() => UserSchema, (user) => user.tasks, { onDelete: "CASCADE" })
	@JoinColumn({ name: "user_id" })
	user: UserSchema;

	/** Foreign key referencing the user */
	@Column()
	user_id: string;
}
