import { ApiProperty } from "@nestjs/swagger";


export class StatusDTO<T> {

	
	@ApiProperty({ 
		description: 'Id of response status' 
	})
	status: string;

	@ApiProperty({ 
		description: 'Data of response status'
	})
	data?: T;

	constructor(status: string, data?: T) {
		this.status = status;
		this.data = data;
	}

}
