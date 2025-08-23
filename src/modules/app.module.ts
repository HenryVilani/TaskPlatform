import { Module } from '@nestjs/common';
import { MainV1Module } from './v1/main.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

/**
 * AppModule
 * 
 * The root module of the application.
 * 
 * Features:
 * - Integrates the MainV1Module for API version v1
 * - Serves static files for API documentation from the '@scalar/api-reference' package
 * 
 * Static Files:
 * - Served under the route `/scalar`
 * - Files are located in `node_modules/@scalar/api-reference/dist/browser`
 * 
 * Imports:
 * - MainV1Module: Core module for API v1
 * - ServeStaticModule: Serves static assets for documentation or other front-end resources
 * 
 * Controllers:
 * - None
 * 
 * Providers:
 * - None
 */


@Module({
	imports: [
		MainV1Module,

		ServeStaticModule.forRoot({
			rootPath: join(__dirname, '..', '..', '..', 'public'),
			serveRoot: '/',
		}),

	],
	controllers: [],
	providers: []
})
export class AppModule {}
