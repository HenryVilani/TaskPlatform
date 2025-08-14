
export abstract class BaseError extends Error {

	id: string;

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
