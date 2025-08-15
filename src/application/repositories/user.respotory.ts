import { User } from "src/domain/user/user.entity";


export interface IUserRepository {

	create(user: User): Promise<User>;
	update(user: User): Promise<User>;
	delete(user: User): Promise<void>;
	
	findById(id: string): Promise<User | null>;
	findByEmail(email: string): Promise<User | null>;

}
