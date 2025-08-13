import { Task } from "src/domain/task.domain";
import { User } from "src/domain/user.domain";


export interface ITaskRepository {

	create(user: User, task: Task): Promise<Task>;
	update(user: User, task: Task): Promise<Task>;
	delete(user: User,task: Task): Promise<void>;

	findTaskById(user: User, id: string): Promise<Task | null>;
	findTasksByUser(user: User): Promise<Task[]>;


}
