import { EmailIsNotValid, PasswordIsNotValid } from "src/application/erros/auth.errors";
import argon2 from "argon2"
import { Logger } from "@nestjs/common";
import { UserFlags } from "src/application/repositories/auth.repository";

export class Email {

	public validatedEmail: string;

	constructor(private email: string) {}

	async validate(): Promise<Email> {

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
			throw new EmailIsNotValid();
		}

		this.validatedEmail = this.email;

		return this;

	}

}

export class Password {

	public validatedPassowrd: string;

	constructor(private rawPassowrd: string, options?: {validated?: boolean}) {

		if (options && options.validated) {

			this.validatedPassowrd = rawPassowrd;

		}

	}

	async validate(): Promise<Password> {

		Logger.log(this.rawPassowrd)
		if (this.rawPassowrd.length < 8 || this.rawPassowrd.length > 35) throw new PasswordIsNotValid();
		if (/\s/.test(this.rawPassowrd)) throw new PasswordIsNotValid();

		this.validatedPassowrd = await argon2.hash(this.rawPassowrd, {type: argon2.argon2id, memoryCost: 2 ** 16, timeCost: 3, parallelism: 1})

		return this;

	}

	async verify(hashedPassowrd: string, rawPassowrd: string): Promise<boolean> {

		return await argon2.verify(hashedPassowrd, rawPassowrd);

	}

}

export class User {

    constructor (
		public readonly id: string, 
		public type: UserFlags,
		public email: Email, 
		public password: Password
	) {}

}

