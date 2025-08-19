import { Injectable } from "@nestjs/common";
import { IUserRepository } from "src/application/repositories/user.respotory";
import { User } from "src/domain/user/user.entity";

/**
 * In-memory implementation of IUserRepository.
 * Stores users in a static array for testing or development purposes.
 */
@Injectable()
export class UserInMemoryRepository implements IUserRepository {
	/** Static array holding all users in memory */
	private static users: User[] = [];

	/**
	 * Creates a new user in memory.
	 * @param user The user entity to create.
	 * @returns The created user.
	 */
	async create(user: User): Promise<User> {
		UserInMemoryRepository.users.push(user);
		return user;
	}

	/**
	 * Updates an existing user in memory.
	 * @param user The user entity with updated data.
	 * @returns The updated user.
	 * @throws Error if the user does not exist.
	 */
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

	/**
	 * Deletes a user from memory.
	 * @param user The user entity to delete.
	 */
	async delete(user: User): Promise<void> {
		UserInMemoryRepository.users = UserInMemoryRepository.users.filter(
			(u) => u.id !== user.id
		);
	}

	/**
	 * Finds a user by their email.
	 * @param email The email address to search for.
	 * @returns The user if found, or null otherwise.
	 */
	async findByEmail(email: string): Promise<User | null> {
		const found = UserInMemoryRepository.users.find(
			(u) => u.email.value === email
		);
		return found || null;
	}

	/**
	 * Finds a user by their ID.
	 * @param id The user's ID.
	 * @returns The user if found, or null otherwise.
	 */
	async findById(id: string): Promise<User | null> {
		const found = UserInMemoryRepository.users.find(
			(u) => u.id === id
		);
		return found || null;
	}
}
