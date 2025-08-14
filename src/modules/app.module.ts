import { Module } from '@nestjs/common';
import { MainV1Module } from './v1/main.module';

@Module({

	imports: [
		MainV1Module,
	],
	controllers: [],
	providers: []
})
export class AppModule {}
