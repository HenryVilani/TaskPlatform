import { EmailIsNotValid } from "src/application/erros/auth.errors";

export class Email {

	private readonly emailValue: string;

	private constructor(email: string) {
		this.emailValue = email;
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

	public get value(): string {

		return this.emailValue;

	}

	public equals(other: Email): boolean {

		return this.value === other.value;

	}

}