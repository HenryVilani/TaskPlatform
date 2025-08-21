import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module';

// Health Check
import { HealthCheckService } from './infrastructure/health/health-check.service';

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

	// SwaggerModule.setup('api-docs', app, documentSwaggerV1, {
	// 	customCss: 
	// });

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
 * 1. Wait for all external services to be healthy (Redis, PostgreSQL, Prometheus, Loki)
 * 2. Initialize the PostgreSQL database connection
 * 3. Create the NestJS application using AppModule
 * 4. Enable CORS
 * 5. Apply global validation pipe for DTOs
 * 6. Apply security headers using Helmet
 * 7. Setup Swagger API documentation
 * 8. Start listening on the configured port (default 3000)
 */
async function bootstrap() {

	// Wait for all services to be healthy before starting the application
	
	// Create a NestJS App
	const app = await NestFactory.create(AppModule);
	// Setup Swagger documentation
	setupDocumentation(app);
	await app.init();
	
	console.log('🚀 Iniciando verificação de saúde dos serviços...');
	const healthCheckService = await app.get(HealthCheckService)
	
	await healthCheckService.waitServices()

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


	// Start the server
	const port = process.env.PORT ?? 8080;
	await app.listen(port);
	console.log(`✅ Aplicação iniciada com sucesso na porta ${port}`);
	console.log(`📚 Documentação da API disponível em: http://localhost:${port}/api-docs/v1`);
}

// Bootstrap the application
bootstrap();
