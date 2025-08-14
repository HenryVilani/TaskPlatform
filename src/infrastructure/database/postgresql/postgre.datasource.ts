
import { DataSource } from "typeorm";
import { UserSchema } from "../schemas/user.schema";
import { TaskSchema } from "../schemas/task.schema";
import { Logger } from "@nestjs/common";

Logger.log(process.env.POSTGRES_USER)

export const PostgreSQLDataSource = new DataSource({
	type: "postgres",
	host: process.env.POSTGRES_HOST,
	username: process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD,
	database: process.env.POSTGRES_DB,
	synchronize: process.env.MODE && process.env.MODE == "DEV" ? true : false,
	logging: false,
	entities: [UserSchema, TaskSchema]

})

