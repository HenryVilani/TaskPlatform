import { Injectable } from "@nestjs/common";
import { IUserRepository } from "src/application/repositories/user.respotory";
import { UserSchema } from "../schemas/user.schema";
import { UserNotFound } from "src/application/erros/auth.errors";
import { Repository, DataSource } from "typeorm";
import { UserRole } from "src/application/repositories/auth.repository";
import { User } from "src/domain/user/user.entity";
import { Email } from "src/domain/user/email.value-object";
import { Password } from "src/domain/user/password.value-object";

/**
 * PostgreSQL implementation of the IUserRepository interface using TypeORM.
 */
@Injectable()
export class UserPostgreImpl implements IUserRepository {

	/** TypeORM repository for the User table */
	private userRepository: Repository<UserSchema>;

	constructor(private dataSource: DataSource) {
		this.userRepository = dataSource.getRepository(UserSchema);
	}

	/**
	 * Creates a new user in the database.
	 * @param user - User entity to create.
	 * @returns The created User entity.
	 */
	async create(user: User): Promise<User> {
		await this.userRepository.save({
			id: user.id,
			email: user.email.value,
			password: user.password.value,
			role: user.role
		});
		return user;
	}

	/**
	 * Deletes a user from the database.
	 * @param user - User entity to delete.
	 * @throws UserNotFound if no user was deleted.
	 */
	async delete(user: User): Promise<void> {
		const result = await this.userRepository.delete({
			id: user.id,
			email: user.email.value,
			password: user.password.value
		});

		if (!result.affected) throw new UserNotFound();
	}

	/**
	 * Updates a user in the database.
	 * @param user - User entity with updated information.
	 * @returns The updated User entity.
	 */
	async update(user: User): Promise<User> {
		await this.userRepository.update({
			id: user.id,
			email: user.email.value,
			password: user.password.value
		}, {
			email: user.email.value,
			password: user.password.value
		});

		return user;
	}

	/**
	 * Finds a user by their unique ID.
	 * @param id - User ID to search for.
	 * @returns The User entity if found, otherwise null.
	 */
	async findById(id: string): Promise<User | null> {
		const user = await this.userRepository.findOneBy({ id });
		if (!user) return null;

		return new User(
			user.id,
			user.role as UserRole,
			Email.create(user.email),
			await new Password(user.password)
		);
	}

	/**
	 * Finds a user by their email address.
	 * @param email - Email to search for.
	 * @returns The User entity if found, otherwise null.
	 */
	async findByEmail(email: string): Promise<User | null> {
		const user = await this.userRepository.findOneBy({ email });
		if (!user) return null;

		return new User(
			user.id,
			user.role as UserRole,
			Email.create(user.email),
			new Password(user.password)
		);
	}
}
