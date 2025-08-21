import { Injectable, Logger } from "@nestjs/common";
import { IHealthService } from "src/application/services/health-service.repository";

export type ServiceStatus = "Health" | "UnHealth";

export interface IHealthServiceRepository {
	waitToConnect(): Promise<boolean>;
}

export interface IService<TService extends IHealthService = IHealthService> {
	name: string;
	service: TService;
	status: ServiceStatus;
}

export interface RetryConfig {
	maxAttempts: number;
	initialDelay: number;
	maxDelay: number;
	backoffMultiplier: number;
}

/**
 * Serviço responsável por verificar a saúde de todos os serviços externos
 * antes da aplicação iniciar completamente
 */
@Injectable()
export class HealthCheckService {
	private services: Map<string, IService> = new Map();

	private readonly logger = new Logger(HealthCheckService.name);

	private readonly defaultRetryConfig: RetryConfig = {
		maxAttempts: 30, // 30 tentativas
		initialDelay: 2000, // 2 segundos
		maxDelay: 30000, // 30 segundos máximo
		backoffMultiplier: 1.5
	};

	register(name: string, service: IHealthService) {
		console.log(`Register: ${name}`)
		this.services.set(name, {
			name,
			service: service,
			status: "UnHealth",
		});
	}

	remove(name: string) {
		this.services.delete(name);
	}

	getService<T extends IHealthService>(name: string): IService<T> | null {

		return this.services.get(name) as IService<T> ?? null;
		
	}

	async waitServices(): Promise<void> {
		

		for (const [key, value] of this.services) {
			let attempts = 0;
			let delay = this.defaultRetryConfig.initialDelay;
			let connected = false;

			while (attempts < this.defaultRetryConfig.maxAttempts) {
				attempts++;
				this.logger.log(`[${key}] Tentando conexão (tentativa ${attempts})...`);

				try {
					const ok = await value.service.isHealth();
					if (ok == "Health") {
						value.status = "Health";
						this.logger.log(`[${key}] Conectado com sucesso ✅`);
						connected = true;
						break;
					}
				} catch (err) {
					this.logger.error(`[${key}] Falha na conexão: ${err}`);
				}

				// aguarda antes da próxima tentativa
				await new Promise(res => setTimeout(res, delay));

				// aplica backoff exponencial limitado
				delay = Math.min(
					delay * this.defaultRetryConfig.backoffMultiplier,
					this.defaultRetryConfig.maxDelay
				);
			}

			if (!connected) {
				value.status = "UnHealth";
			}
		}

	}

	async checkAllServices(): Promise<IService[]> {

		let services: IService[] = [];

		for (const [name, value] of this.services) {

			try {

				const status = await value.service.isHealth();

				services.push({
					name,
					service: value.service,
					status
				})

			}catch (err) {

				services.push({
					name,
					service: value.service,
					status: "UnHealth"
				})

			}

		}

		return services;

	}

	lastStatusAll(): IService[] {

		let services: IService[] = [];

		this.services.forEach((service, name) => {

			services.push(service);

		})

		return services;

	}
	
}
