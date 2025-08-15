import { EmailIsNotValid } from "src/application/erros/auth.errors";

export class Email {

	public readonly value: string;

	private constructor(email: string) {
		this.value = email;
	}

	public static create(plainEmail: string): Email {
		
		const trimmedEmail = plainEmail.trim();

		if (!Email.isValid(trimmedEmail)) {
			throw new EmailIsNotValid();
		}

		return new Email(trimmedEmail);
	}

	private static isValid(email: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	public equals(other: Email): boolean {

		return this.value === other.value;

	}

}