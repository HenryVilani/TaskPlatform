import { Injectable } from "@nestjs/common";
import { ITaskRepository } from "src/application/repositories/task.repository";
import { Task } from "src/domain/task/task.entity";
import { User } from "src/domain/user/user.entity";
import { TaskSegment } from "src/domain/task/task-segment";

@Injectable()
export class TaskInMemoryRepository implements ITaskRepository {
    private static tasks: Task[] = [];

    async create(user: User, task: Task): Promise<Task> {
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

    async findById(user: User, id: string): Promise<Task | null> {
        const task = TaskInMemoryRepository.tasks.find(
            (t) => t.id === id && t.user.id === user.id
        );
        return task || null;
    }

    async findAllByUser(user: User): Promise<Task[]> {
        return TaskInMemoryRepository.tasks.filter((t) => t.user.id === user.id);
    }

    async getAllBySegment(user: User, limit: number, cursor?: string): Promise<TaskSegment> {
        let userTasks = TaskInMemoryRepository.tasks
            .filter((t) => t.user.id === user.id)
            .sort((a, b) => a.id.localeCompare(b.id)); // ordenação por ID

        if (cursor) {
            const lastId = TaskSegment.fromCursor(cursor);
            userTasks = userTasks.filter((t) => t.id > lastId);
        }

        const hasMore = userTasks.length > limit;
        const segmentTasks = userTasks.slice(0, limit);

        return new TaskSegment(
            segmentTasks,
            hasMore,
            hasMore ? TaskSegment.toCursor(segmentTasks[segmentTasks.length - 1].id) : undefined
        );
    }
}
