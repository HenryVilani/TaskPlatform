import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { UserSchema } from "./user.schema";
import { type TaskNotifyType, type TaskNotifyStatus } from "src/domain/task/task.entity";

/**
 * TypeORM schema representing a Task entity in the database.
 * Maps the Task domain entity to database table structure.
 */
@Entity('tasks')
export class TaskSchema {

	/**
	 * Unique identifier for the task
	 * @type {string}
	 */
	@PrimaryColumn("varchar")
	id: string;

	/**
	 * Optional job ID for scheduled tasks
	 * @type {string}
	 */
	@Column({type: "text", nullable: true, default: null})
	jobId: string | null;

	/**
	 * Name/title of the task
	 * @type {string}
	 */
	@Column()
	name: string;

	/**
	 * Content or description of the task
	 * @type {string}
	 */
	@Column()
	content: string;

	/**
	 * Task creation timestamp in ISO string format
	 * @type {string}
	 */
	@Column()
	created_at: string;

	/**
	 * Task last update timestamp in ISO string format
	 * @type {string}
	 */
	@Column()
	updated_at: string;

	/**
	 * Scheduled notification time, if any
	 * @type {string | null}
	 */
	@Column({ type: "varchar", nullable: true })
	notify_at: string | null;

	/**
	 * Status of the notification (e.g., PENDING, SENT, SCHEDULED, VOID)
	 * @type {TaskNotifyStatus}
	 */
	@Column({ type: "varchar", nullable: true })
	notify_status: TaskNotifyStatus;

	/**
	 * Notification type (e.g., EveryTime, OneTime, Never)
	 * @type {TaskNotifyType}
	 */
	@Column({ type: "varchar", nullable: true })
	notify_type: TaskNotifyType;

	/**
	 * Relation to the User who owns the task.
	 * On deletion of the user, all related tasks are deleted (CASCADE).
	 * @type {UserSchema}
	 */
	@ManyToOne(() => UserSchema, (user) => user.tasks, { onDelete: "CASCADE" })
	@JoinColumn({ name: "user_id" })
	user: UserSchema;

	/**
	 * Foreign key referencing the user
	 * @type {string}
	 */
	@Column()
	user_id: string;
}