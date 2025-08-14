import { User } from "src/domain/user.domain"
import { IAuthGuard } from '@nestjs/passport';
export type UserFlags = "USER";

export interface IAuthRepository {

	getToken(user: User): string;
	validateToken(token: string): any;
	authenticate(user: User, tryPassword: string): Promise<boolean>;
	authorize(user: User, flag: UserFlags): Promise<boolean>;

}
