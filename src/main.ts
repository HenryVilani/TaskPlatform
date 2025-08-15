import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './modules/app.module';

//Database Import
import { PostgreSQLDataSource } from './infrastructure/database/postgresql/postgre.datasource';
import { LoggingInterceptor } from './infrastructure/interceptors/logging.interceptor';
import helmet from "helmet"
import { apiReference } from "@scalar/nestjs-api-reference";

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
	}))


}

async function bootstrap() {

	// Initialize the database
	PostgreSQLDataSource.initialize();
	
	// create a NestJS App
	const app = await NestFactory.create(AppModule);

	app.enableCors();

	// validation pipe
	app.useGlobalPipes(new ValidationPipe({
		whitelist: true,
		forbidUnknownValues: true,
		transform: true,
		transformOptions: {
			enableImplicitConversion: true
		}
	}));

	app.useGlobalInterceptors(new LoggingInterceptor());
	app.use(helmet());
	
	
	// Setup documentation
	setupDocumentation(app);
	

	await app.listen(process.env.PORT ?? 3000);

}

bootstrap();
