/**
 * Abstract base class for custom errors.
 * Extends the native JavaScript Error class.
 */
export abstract class BaseError extends Error {
	/**
	 * Unique identifier for the error type.
	 */
	id: string;

	/**
	 * @param id Unique identifier of the error.
	 * @param message Human-readable error message.
	 * @param statusCode HTTP status code associated with the error.
	 */
	constructor(
		id: string,
		message: string,
		public readonly statusCode: number
	) {
		super(message);
		this.name = this.constructor.name;
		this.id = id;
	}
}
