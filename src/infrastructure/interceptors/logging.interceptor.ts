import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Request } from "express";
import { DateTime } from "luxon";
import { Observable } from "rxjs";
import { tap} from "rxjs/operators"
import { TokenDataDTO } from "src/application/dtos/token.dto";


@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger("HTTP");

	intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
	
		const request = context.switchToHttp().getRequest<Request>();
		const { method, url } = request;
		const useAgent = request.get("User-Agent") || '';
		const ip = request.ip;
		const userId = (request.user as TokenDataDTO)?.sub ?? "anonymous";
		const now = DateTime.now();

		return next.handle().pipe(
			tap({
				next: () => {
					
					const responseTime = DateTime.now().diff(now);
					this.logger.log(`← ${method} ${url} - ${responseTime}ms`);

				},
				error: (error) => {

					const responseTime = DateTime.now().diff(now);
          			this.logger.error(`← ${method} ${url} - ${responseTime}ms - ERROR: ${error.message}`);

				}
			})
		)
		
	}



}
