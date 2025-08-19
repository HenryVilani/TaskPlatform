import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module';

// Database Import
import { PostgreSQLDataSource } from './infrastructure/database/postgresql/postgre.datasource';

// security
import helmet from "helmet";

// documentation
import { apiReference } from "@scalar/nestjs-api-reference";
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Sets up Swagger/OpenAPI documentation for the application
 * 
 * @param app - The NestJS application instance
 */
const setupDocumentation = (app: INestApplication) => {
	const configV1 = new DocumentBuilder()
		.setTitle("Notify Platform - API Reference")
		.setDescription("Documentação completa das rotas do Notify Platform")
		.setVersion("1.0")
		.addBearerAuth()
		.build();

	const documentSwaggerV1 = SwaggerModule.createDocument(app, configV1);

	app.use("/api-docs/v1", apiReference({
		content: documentSwaggerV1,
		theme: "deepSpace",
		cdn: "/scalar/standalone.js"
	}));
}

/**
 * Main bootstrap function to initialize the NestJS application
 * 
 * Steps:
 * 1. Initialize the PostgreSQL database connection
 * 2. Create the NestJS application using AppModule
 * 3. Enable CORS
 * 4. Apply global validation pipe for DTOs
 * 5. Apply security headers using Helmet
 * 6. Setup Swagger API documentation
 * 7. Start listening on the configured port (default 3000)
 */
async function bootstrap() {

	// Initialize the database
	PostgreSQLDataSource.initialize();

	// Create a NestJS App
	const app = await NestFactory.create(AppModule);

	// Enable CORS for cross-origin requests
	app.enableCors();

	// Global validation pipe for request DTOs
	app.useGlobalPipes(new ValidationPipe({
		whitelist: true,
		forbidUnknownValues: true,
		transform: true,
		transformOptions: {
			enableImplicitConversion: true
		}
	}));

	// Apply security headers
	app.use(helmet());

	// Setup Swagger documentation
	setupDocumentation(app);

	// Start the server
	await app.listen(process.env.PORT ?? 3000);
}

// Bootstrap the application
bootstrap();
