import { EmailIsNotValid } from "src/application/erros/auth.errors";

/**
 * Value Object representing a validated email address.
 */
export class Email {
	/**
	 * The value of the email address.
	 */
	public readonly value: string;

	/**
	 * Private constructor to enforce creation via the static `create` method.
	 * @param email The validated email address.
	 */
	private constructor(email: string) {
		this.value = email;
	}

	/**
	 * Creates a new Email instance after validation.
	 * @param plainEmail The plain email string to validate and wrap.
	 * @throws {EmailIsNotValid} Thrown if the email format is invalid.
	 * @returns A new Email instance.
	 */
	public static create(plainEmail: string): Email {
		const trimmedEmail = plainEmail.trim();

		if (!Email.isValid(trimmedEmail)) {
			throw new EmailIsNotValid();
		}

		return new Email(trimmedEmail);
	}

	/**
	 * Validates the email format.
	 * @param email The email string to validate.
	 * @returns True if the email format is valid, false otherwise.
	 */
	private static isValid(email: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	/**
	 * Compares this Email with another to check for equality.
	 * @param other Another Email instance to compare with.
	 * @returns True if both email values are equal, false otherwise.
	 */
	public equals(other: Email): boolean {
		return this.value === other.value;
	}
}
