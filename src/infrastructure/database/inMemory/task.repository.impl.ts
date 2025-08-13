import { Injectable } from "@nestjs/common";
import { ITaskRepository } from "src/application/repositories/task.repository";
import { Task } from "src/domain/task.domain";
import { User } from "src/domain/user.domain";

@Injectable()
export class TaskInMemoryRepository implements ITaskRepository {
	private static tasks: Task[] = [];

	async create(user: User, task: Task): Promise<Task> {
		// garante que o task pertence ao user
		TaskInMemoryRepository.tasks.push(task);
		return task;
	}

	async update(user: User, task: Task): Promise<Task> {
		const index = TaskInMemoryRepository.tasks.findIndex(
			(t) => t.id === task.id && t.user.id === user.id
		);

		if (index === -1) {
			throw new Error(`Task ${task.id} not found for user ${user.id}`);
		}

		TaskInMemoryRepository.tasks[index] = task;
		return task;
	}

	async delete(user: User, task: Task): Promise<void> {
		TaskInMemoryRepository.tasks = TaskInMemoryRepository.tasks.filter(
			(t) => !(t.id === task.id && t.user.id === user.id)
		);
	}

	async findTaskById(user: User, id: string): Promise<Task | null> {
		const task = TaskInMemoryRepository.tasks.find(
			(t) => t.id === id && t.user.id === user.id
		);
		return task || null;
	}

	async findTasksByUser(user: User): Promise<Task[]> {
		return TaskInMemoryRepository.tasks.filter((t) => t.user.id === user.id);
	}
}
