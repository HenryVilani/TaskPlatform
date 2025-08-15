import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class IAccountOutDTO {

	@ApiProperty({
		description: "Email of user",
		type: "string",
		example: "test@gmail.com",
		required: true
	})
	@IsString()
	@IsNotEmpty()
	@IsEmail()
	id: string;

	@ApiProperty({
		description: "Password of user",
		type: "string",
		example: "senha123",
		required: true
	})
	@IsString()
	@IsNotEmpty()
	@Length(8, 255)
	email: string;

};
