import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Matches } from "class-validator";

/**
 * DTO for returning account information.
 * Used when exposing user data in responses.
 */
export class IAccountInfoDTO {

	/**
	 * Unique identifier of the user account.
	 * Must be a valid ULID (26-character string).
	 */
	@ApiProperty({
		description: "Id of the user account",
		type: "string",
		example: "01K31DX9HCR81KKD18HXGARCVQ",
		required: true
	})
	@Matches(/^[0-9A-HJKMNP-TV-Z]{26}$/, { message: 'Field must be a valid ULID' })
	id: string;

	/**
	 * Email address of the user.
	 * Must be a non-empty valid email string.
	 */
	@ApiProperty({
		description: "Email of the user",
		type: "string",
		example: "test@gmail.com",
		required: true
	})
	@IsString()
	@IsNotEmpty()
	@IsEmail()
	email: string;
}
