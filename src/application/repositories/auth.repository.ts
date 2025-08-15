import { User } from "src/domain/user/user.entity";

export type UserRole = "User" | "Admin";

export interface IAuthRepository {

	getToken(user: User): string;
	validateToken(token: string): any;
	authenticate(user: User, tryPassword: string): Promise<boolean>;
	authorize(user: User, flag: UserRole): Promise<boolean>;

}
