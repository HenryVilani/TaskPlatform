import { PasswordIsNotValid } from "src/application/erros/auth.errors";
import argon2 from "argon2";

/**
 * Value Object representing a validated and hashed password.
 * Handles password creation, validation, hashing, and verification.
 */
export class Password {
	/** The hashed password */
	private readonly hashed: string;

	/** The plain password (only stored temporarily for creation) */
	private plainPassword: string;

	/**
	 * Private constructor to enforce creation via the static `create` method.
	 * @param hashedPassword The hashed password string.
	 */
	constructor(hashedPassword: string) {
		this.hashed = hashedPassword;
	}

	/**
	 * Creates a new Password instance by validating and hashing the raw password.
	 * @param rawPassword The plain password to validate and hash.
	 * @throws {PasswordIsNotValid} Thrown if the password is invalid (length < 8 or > 35, or contains spaces).
	 * @returns A Promise that resolves to a new Password instance.
	 */
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

	/**
	 * Gets the hashed password value.
	 */
	public get value(): string {
		return this.hashed;
	}

	/**
	 * Gets the plain password value (only available after creation).
	 */
	public get plain(): string {
		return this.plainPassword;
	}

	/**
	 * Verifies a raw password against the stored hashed password.
	 * @param rawPassword The plain password to verify.
	 * @returns A Promise that resolves to true if the password matches, false otherwise.
	 */
	public async verify(rawPassword: string): Promise<boolean> {
		return await argon2.verify(this.hashed, rawPassword);
	}

	/**
	 * Compares this Password with another Password instance for equality.
	 * @param other Another Password instance to compare with.
	 * @returns True if both passwords have the same hash, false otherwise.
	 */
	public equals(other: Password): boolean {
		return this.hashed === other.hashed;
	}
}
