
export abstract class BaseError extends Error {

	responseMessage: string;

	constructor(
		responseMessage: string,
		message: string,
		public readonly statusCode: number
	) {
		super(message);
		this.name = this.constructor.name;
		this.responseMessage = responseMessage;
	}
}
