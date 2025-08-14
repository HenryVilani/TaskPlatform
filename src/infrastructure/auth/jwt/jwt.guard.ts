import { CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";
import { StatusDTO } from "src/application/dtos/output/status.out.dto";
import { InvalidToken } from "src/application/erros/auth.errors";
import { IAuthRepository } from "src/application/repositories/auth.repository";

export class JWTGuard implements CanActivate {

	constructor(
		private readonly authRepository: IAuthRepository 
	) {}

	canActivate(context: ExecutionContext): boolean {
		
		const request = context.switchToHttp().getRequest();
		const token = request.headers["authorization"]?.split(" ")[1];

		if (!token) {

			throw new UnauthorizedException(new StatusDTO("unauthorized"));

		}

		try {

			const payload = this.authRepository.validateToken(token);
			request.user = payload;
			
			return true;

		}catch(error) {

			throw new InvalidToken();

		}

	}


}

