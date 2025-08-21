import { DataSource } from "typeorm";
import { UserSchema } from "../schemas/user.schema";
import { TaskSchema } from "../schemas/task.schema";
import { DataSourceOptions } from "typeorm";

/**
 * Configuration object for PostgreSQL using TypeORM.
 */
export const PostgreSQLConfig = {
	/** Database type */
	type: "postgres",
	/** Database host, loaded from environment variables */
	host: "localhost", // process.env.POSTGRES_HOST
	/** Database username, loaded from environment variables */
	username: process.env.POSTGRES_USER,
	/** Database password, loaded from environment variables */
	password: process.env.POSTGRES_PASSWORD,
	/** Database name, loaded from environment variables */
	database: process.env.POSTGRES_DB,
	/** Automatically synchronize schema in development mode */
	synchronize: process.env.MODE && process.env.MODE === "DEV" ? true : false,
	/** Enable logging */
	logging: false,
	/** Entities used by TypeORM */
	entities: [UserSchema, TaskSchema],
};

/**
 * TypeORM DataSource instance for PostgreSQL.
 * Can be used to initialize database connections.
 */
//export const PostgreSQLDataSource = new DataSource(PostgreSQLConfig as DataSourceOptions);
