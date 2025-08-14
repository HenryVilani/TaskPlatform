import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

import { AppModule } from './modules/app.module';

//Database Import
import { PostgreSQLDataSource } from './infrastructure/database/postgresql/postgre.datasource';


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
		theme: "deepSpace"
	}))


}

async function bootstrap() {

	// Initialize the database
	PostgreSQLDataSource.initialize();
	
	// create a NestJS App
	const app = await NestFactory.create(AppModule);
	
	// Setup documentation
	setupDocumentation(app);
	

	await app.listen(process.env.PORT ?? 3000);

}

bootstrap();
