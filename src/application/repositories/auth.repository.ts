import { User } from "src/domain/user.domain"

export type UserFlags = "USER";

export interface IAuthRepository {

	getToken(user: User): string;
	authenticate(user: User, tryPassword: string): Promise<boolean>;
	authorize(user: User, flag: UserFlags): Promise<boolean>;

}
