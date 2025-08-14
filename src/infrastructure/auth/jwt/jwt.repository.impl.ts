import { ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { IAuthRepository, UserFlags } from "src/application/repositories/auth.repository";
import { type IUserRepository } from "src/application/repositories/user.respotory";
import { Password, User } from "src/domain/user.domain";
import argon2 from "argon2"
import { StatusDTO } from "src/application/dtos/output/status.out.dto";
import jsonwebtoken from "jsonwebtoken";
import { InvalidToken } from "src/application/erros/auth.errors";


@Injectable()
export class JWTImpl implements IAuthRepository {

	private readonly secret = process.env.JWT_SECRET || "secret";

	async authenticate(user: User, tryPassword: string): Promise<boolean> {
		
		const validPassword = await new Password(tryPassword).validate()

		return await argon2.verify(user.password.validatedPassowrd, tryPassword);

	}

	async authorize(user: User, flag: UserFlags): Promise<boolean> {
		
		return user.type == flag;

	}

	getToken(user: User): string {
		
		const payload = {

			sub: user.id,
			email: user.email

		}

		return jsonwebtoken.sign(payload, this.secret)

	}

	validateToken(token: string): any {
		
		try {
			
			return jsonwebtoken.verify(token, this.secret);
			
		}catch (error) {

			throw new InvalidToken();

		}

	}
	

}
