import { Task } from "src/domain/task/task.entity";

export interface ISchedulerRepository {

	schedule(task: Task): Promise<void>;

}
