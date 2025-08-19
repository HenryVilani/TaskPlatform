import { ApiProperty } from "@nestjs/swagger";


/**
 * Generic Data Transfer Object for response status.
 * @template T Optional type of the response data.
 */
export class StatusDTO<T> {

	/**
   	 * Identifier of the response status.
   	 */
	@ApiProperty({ 
		description: 'Id of response status' 
	})
	status: string;

	/**
     * Response data, if any.
	 */
	@ApiProperty({ 
		description: 'Data of response status'
	})
	data?: T;

	/**
   	 * Creates a new StatusDTO instance.
   	 * @param status Identifier of the response status.
   	 * @param data Optional data associated with the response.
   	 */
	constructor(status: string, data?: T) {
		this.status = status;
		this.data = data;
	}

}
