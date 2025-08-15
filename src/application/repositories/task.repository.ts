import { TaskSegment } from "src/domain/task/task-segment";
import { Task } from "src/domain/task/task.entity";
import { User } from "src/domain/user/user.entity";

export interface ITaskRepository {

	create(user: User, task: Task): Promise<Task>;
	update(user: User, task: Task): Promise<Task>;
	delete(user: User, task: Task): Promise<void>;

	findById(user: User, id: string): Promise<Task | null>;
	findAllByUser(user: User): Promise<Task[]>;

	getAllBySegment(user: User, limit: number, cursor?: string): Promise<TaskSegment>;

}
