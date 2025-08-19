
/**
 * Data Transfer Object containing JWT token information.
 */
export class TokenDataDTO {

	/**
   	 * User identifier (id in users table database).
   	 */
	sub: string;

	/**
   	 * Email of the user associated with the token.
   	 */
	email: string;

}
