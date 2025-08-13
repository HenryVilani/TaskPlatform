import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { MainDataSource } from './infrastructure/database/datasource';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MainV1Module } from './modules/v1/main.module';
import { TaskController } from './interfaces/http/v1/task.controller';
import { TasksModule } from './modules/v1/tasks.module';

async function bootstrap() {

	const configV1 = new DocumentBuilder()
		.setTitle("Notify Platform - API Reference")
		.setDescription("Documentação completa das rotas do Notify Platform")
		.setVersion("1.0")
		.addBearerAuth()
		.build();
	
	const configV2 = new DocumentBuilder()
		.setTitle("Notify Platform - API Reference")
		.setDescription("Documentação completa das rotas do Notify Platform")
		.setVersion("2.0")
		.addBearerAuth()
		.build();


	MainDataSource.initialize();
	const app = await NestFactory.create(AppModule);
	
	const documentSwaggerV1 = () => SwaggerModule.createDocument(app, configV1, {
		include: [MainV1Module, TasksModule]
	});

	SwaggerModule.setup('api-docs/v1', app, documentSwaggerV1);
	
	await app.listen(process.env.PORT ?? 3000);



}

bootstrap();
