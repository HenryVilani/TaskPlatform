import { IAuthRepository, UserRole } from "src/application/repositories/auth.repository";
import argon2 from "argon2"
import jsonwebtoken from "jsonwebtoken";
import { InvalidToken } from "src/application/erros/auth.errors";
import { Injectable } from "@nestjs/common";
import { User } from "src/domain/user/user.entity";
import { Password } from "src/domain/user/password.value-object";


@Injectable()
export class JWTImpl implements IAuthRepository {

	private readonly secret = process.env.JWT_SECRET || "secret";

	async authenticate(user: User, tryPassword: string): Promise<boolean> {
		
		const validPassword = await Password.create(tryPassword)

		return await argon2.verify(user.password.value, validPassword.plain);

	}

	async authorize(user: User, role: UserRole): Promise<boolean> {
		
		return user.role == role;

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
