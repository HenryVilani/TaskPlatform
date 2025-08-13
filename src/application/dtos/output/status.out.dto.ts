
export class StatusOutDTO<T> {

	constructor(private message: string, private data?: T) {}

	toDict() {

		return {

			status: {

				message: this.message

			},

			data: this.data

		}

	}

}
