import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

/**
 * DTO for user authentication.
 * Contains credentials required for login.
 */
export class UserAuthDTO {

	@ApiProperty({
		description: "Email of the user",
		type: "string",
		example: "test@gmail.com",
		required: true
	})
	@IsString()
	@IsNotEmpty()
	@IsEmail()
	email: string; // User's email address

	@ApiProperty({
		description: "Password of the user",
		type: "string",
		example: "senha123",
		required: true
	})
	@IsString()
	@IsNotEmpty()
	@Length(8, 255)
	password: string; // User's password (min 8 characters)
}
