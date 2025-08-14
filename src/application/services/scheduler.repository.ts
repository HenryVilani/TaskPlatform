import { Task } from "src/domain/task.domain";

export interface ISchedulerRepository {

	schedule(task: Task): Promise<void>;

}
