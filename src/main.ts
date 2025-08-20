import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from './modules/app.module';

// Database Import
import { PostgreSQLDataSource } from './infrastructure/database/postgresql/postgre.datasource';

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
	console.log('🚀 Iniciando verificação de saúde dos serviços...');
	const healthCheckService = new HealthCheckService();
	
	try {
		await healthCheckService.waitForAllServicesHealthy({
			maxAttempts: 60, // 60 tentativas
			initialDelay: 3000, // 3 segundos inicial
			maxDelay: 30000, // 30 segundos máximo
			backoffMultiplier: 1.2 // Incremento mais suave
		});
	} catch (error) {
		console.error('💥 Falha na verificação de saúde dos serviços:', error.message);
		console.error('🛑 Encerrando aplicação...');
		process.exit(1);
	}


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
	const port = process.env.PORT ?? 3000;
	await app.listen(port);
	console.log(`✅ Aplicação iniciada com sucesso na porta ${port}`);
	console.log(`📚 Documentação da API disponível em: http://localhost:${port}/api-docs/v1`);
}

// Bootstrap the application
<<<<<<< Current (Your changes)
bootstrap();
=======
bootstrap().catch(error => {
	console.error('💥 Erro fatal durante a inicialização:', error);
	process.exit(1);
});
>>>>>>> Incoming (Background Agent changes)
