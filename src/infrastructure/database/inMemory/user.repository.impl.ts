import { Injectable } from "@nestjs/common";
import { IUserRepository } from "src/application/repositories/user.respotory";
import { User } from "src/domain/user/user.entity";

@Injectable()
export class UserInMemoryRepository implements IUserRepository {
	private static users: User[] = [];

	async create(user: User): Promise<User> {

		UserInMemoryRepository.users.push(user);
		return user;

	}

	async update(user: User): Promise<User> {
		
		const index = UserInMemoryRepository.users.findIndex(
			(u) => u.id === user.id
		);

		if (index === -1) {
			throw new Error(`User ${user.id} not found`);
		}

		UserInMemoryRepository.users[index] = user;
		return user;
	}

	async delete(user: User): Promise<void> {
		UserInMemoryRepository.users = UserInMemoryRepository.users.filter(
			(u) => u.id !== user.id
		);
	}

	async findByEmail(email: string): Promise<User | null> {
		const found = UserInMemoryRepository.users.find(
			(u) => u.email.value === email
		);
		return found || null;
	}

	async findById(id: string): Promise<User | null> {
		const found = UserInMemoryRepository.users.find(
			(u) => u.id === id
		);
		return found || null;
	}
}
