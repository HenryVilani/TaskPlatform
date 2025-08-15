import { Module } from '@nestjs/common';
import { MainV1Module } from './v1/main.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({

	imports: [
		MainV1Module,

		ServeStaticModule.forRoot({
			rootPath: join(__dirname, '..', '..', '..', 'node_modules', '@scalar', 'api-reference', 'dist', 'browser'),
			serveRoot: '/scalar',
		  }),

	],
	controllers: [],
	providers: []
})
export class AppModule {}
