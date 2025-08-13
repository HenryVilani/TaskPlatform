import { Injectable } from "@nestjs/common";
import { IUserRepository } from "src/application/repositories/user.respotory";
import { Email, Password, User } from "src/domain/user.domain";
import { MainDataSource } from "../datasource";
import { UserSchema } from "../schemas/user.schema";
import { UserNotFound } from "src/application/erros/auth.errors";


@Injectable()
export class UserSQLiteImpl implements IUserRepository {

	private userRepository = MainDataSource.getRepository(UserSchema);

	async create(user: User): Promise<User> {

		await this.userRepository.save({
			id: user.id,
			email: user.email.validatedEmail,
			password: user.password.validatedPassowrd

		});

		return user;

	}

	async delete(user: User): Promise<void> {

		const result = await this.userRepository.delete({
			id: user.id,
			email: user.email.validatedEmail,
			password: user.password.validatedPassowrd
		});

		if (!result.affected) throw new UserNotFound();

	}

	async update(user: User): Promise<User> {

		await this.userRepository.update({
			id: user.id,
			email: user.email.validatedEmail,
			password: user.password.validatedPassowrd
		}, {
			email: user.email.validatedEmail,
			password: user.password.validatedPassowrd
		});

		return user;

	}

	async findById(id: string): Promise<User | null> {

		const user = await this.userRepository.findOneBy({ id });
		if (!user) return null;

		return new User(
			user.id,
			await new Email(user.email).validate(),
			new Password(user.password, {validated: true})
		);

	}

	async findByEmail(email: string): Promise<User | null> {
		
		const user = await this.userRepository.findOneBy({ email });
		if (!user) return null;

		return new User(
			user.id,
			await new Email(user.email).validate(),
			new Password(user.password, {validated: true})
		);


	}

}
