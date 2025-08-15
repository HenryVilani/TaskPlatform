import { PasswordIsNotValid } from "src/application/erros/auth.errors";
import argon2 from "argon2";

export class Password {

	private readonly hashed: string;
	private plainPassword: string;

	constructor(hashedPassword: string) {

		this.hashed = hashedPassword;

	}

	public static async create(rawPassword: string): Promise<Password> {

		const trimmed = rawPassword.trim();

		if (trimmed.length < 8 || trimmed.length > 35) throw new PasswordIsNotValid();
		if (/\s/.test(trimmed)) throw new PasswordIsNotValid();

		const hashed = await argon2.hash(trimmed, {
			type: argon2.argon2id,
			memoryCost: 2 ** 16,
			timeCost: 3,
			parallelism: 1,
		});

		const password = new Password(hashed);
		password.plainPassword = trimmed;
		return password;

	}

	public get value(): string {

		return this.hashed;

	}

	public get plain(): string {
		return this.plainPassword;
	}

	public async verify(rawPassword: string): Promise<boolean> {

		return await argon2.verify(this.hashed, rawPassword);

	}

	public equals(other: Password): boolean {

		return this.hashed === other.hashed;

	}
	
}
