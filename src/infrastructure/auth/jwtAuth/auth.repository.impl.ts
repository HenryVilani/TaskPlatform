import { Inject, Injectable } from "@nestjs/common";
import { IAuthRepository, UserFlags } from "src/application/repositories/auth.repository";
import { type IUserRepository } from "src/application/repositories/user.respotory";
import { Password, User } from "src/domain/user.domain";
import argon2 from "argon2"
import { JwtService } from "@nestjs/jwt";


@Injectable()
export class AuthJWTImpl implements IAuthRepository {

	constructor(
		@Inject("IUserRepository") private userRepository: IUserRepository,
		private jwtService: JwtService
	) {}

	async authenticate(user: User, tryPassword: string): Promise<boolean> {
		
		const validPassword = await new Password(tryPassword).validate()

		return await argon2.verify(user.password.validatedPassowrd, tryPassword);

	}

	async authorize(user: User, flag: UserFlags): Promise<boolean> {
		
		if (flag == "USER") {

			return true;

		}

		return false;

	}

	getToken(user: User): string {
		
		const payload = {

			sub: user.id,
			email: user.email

		}

		return this.jwtService.sign(payload);

	}

}
