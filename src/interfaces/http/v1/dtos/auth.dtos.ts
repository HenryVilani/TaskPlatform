import { ApiProperty } from "@nestjs/swagger";

export class UserAuthDTO {

	@ApiProperty({
		description: "Email of user",
		type: "string",
		example: "test@gmail.com"
	})
	email: string;
	
	@ApiProperty({
		description: "Password of user",
		type: "string",
		example: "senha123"
	})
	password: string;
}
