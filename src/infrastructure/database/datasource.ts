import { DataSource } from "typeorm";
import { UserSchema } from "./schemas/user.schema";
import { TaskSchema } from "./schemas/task.schema";

export const MainDataSource = new DataSource({
	type: "sqlite",
	database: "db.sqlite",
	synchronize: true,
	entities: [UserSchema, TaskSchema]
})
