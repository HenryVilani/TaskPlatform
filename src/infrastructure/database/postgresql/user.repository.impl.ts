import { Injectable } from "@nestjs/common";
import { IUserRepository } from "src/application/repositories/user.respotory";
import { UserSchema } from "../schemas/user.schema";
import { UserNotFound } from "src/application/erros/auth.errors";
import { Repository, DataSource } from "typeorm";
import { UserRole } from "src/application/repositories/auth.repository";
import { User } from "src/domain/user/user.entity";
import { Email } from "src/domain/user/email.value-object";
import { Password } from "src/domain/user/password.value-object";


@Injectable()
export class UserPostgreImpl implements IUserRepository {

	private userRepository: Repository<UserSchema>;

	constructor(private dataSource: DataSource) {
		this.userRepository = dataSource.getRepository(UserSchema);
	}

	async create(user: User): Promise<User> {

		await this.userRepository.save({
			id: user.id,
			email: user.email.value,
			password: user.password.value,
			role: user.role

		});

		return user;

	}

	async delete(user: User): Promise<void> {

		const result = await this.userRepository.delete({
			id: user.id,
			email: user.email.value,
			password: user.password.value
		});

		if (!result.affected) throw new UserNotFound();

	}

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
