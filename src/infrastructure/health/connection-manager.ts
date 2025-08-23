import { Injectable, Logger } from "@nestjs/common";
import { LokiServiceImpl } from "../observability/loki/loki.service.impl";

export interface ConnectionConfig {
	maxRetries: number;
	retryDelay: number;
	connectionTimeout: number;
	keepAlive: boolean;
}

/**
 * Gerencia conexões singleton para evitar múltiplas conexões desnecessárias
 */
@Injectable()
export class ConnectionManager {
	private connections: Map<string, any> = new Map();
	private connectionPromises: Map<string, Promise<any>> = new Map();
	private connectionStatus: Map<string, 'connecting' | 'connected' | 'disconnected' | 'error'> = new Map();

	constructor(
		private readonly logger: LokiServiceImpl
	) {}

	/**
	 * Obtém ou cria uma conexão singleton
	 */
	async getConnection<T>(
		name: string, 
		factory: () => Promise<T>,
		config?: Partial<ConnectionConfig>
	): Promise<T | null> {
		
		// Se já existe conexão ativa, retorna ela
		if (this.connections.has(name) && this.connectionStatus.get(name) === 'connected') {
			return this.connections.get(name);
		}

		// Se já está conectando, espera a promise existente
		if (this.connectionPromises.has(name)) {
			try {
				return await this.connectionPromises.get(name);
			} catch (error) {
				// Se falhou, remove da cache e tenta novamente
				this.connectionPromises.delete(name);
				this.connectionStatus.delete(name);
			}
		}

		// Cria nova conexão
		const connectionPromise = this.createConnection(name, factory, config);
		this.connectionPromises.set(name, connectionPromise);

		try {
			const connection = await connectionPromise;
			this.connections.set(name, connection);
			this.connectionStatus.set(name, 'connected');
			this.connectionPromises.delete(name);
			
			this.logger.register("Info", "CONNECTION_MANAGER", {
				service: name,
				action: "connection_established",
				timestamp: new Date().toISOString()
			});

			return connection;
		} catch (error) {
			this.connectionStatus.set(name, 'error');
			this.connectionPromises.delete(name);
			
			this.logger.register("Error", "CONNECTION_MANAGER", {
				service: name,
				action: "connection_failed",
				error: error.message,
				timestamp: new Date().toISOString()
			});

			return null;
		}
	}

	/**
	 * Cria conexão com timeout e retry logic
	 */
	private async createConnection<T>(
		name: string,
		factory: () => Promise<T>,
		config?: Partial<ConnectionConfig>
	): Promise<T> {
		const finalConfig: ConnectionConfig = {
			maxRetries: 2, // Reduzido para evitar spam
			retryDelay: 2000, // Aumentado
			connectionTimeout: 3000, // Reduzido
			keepAlive: true,
			...config
		};

		this.connectionStatus.set(name, 'connecting');

		for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
			try {
				this.logger.register("Info", "CONNECTION_MANAGER", {
					service: name,
					action: "connection_attempt",
					attempt,
					maxRetries: finalConfig.maxRetries,
					timestamp: new Date().toISOString()
				});

				// Create connection with timeout
				const connection = await Promise.race([
					factory(),
					new Promise<never>((_, reject) => 
						setTimeout(() => reject(new Error('Connection timeout')), finalConfig.connectionTimeout)
					)
				]);

				this.logger.register("Info", "CONNECTION_MANAGER", {
					service: name,
					action: "connection_success",
					attempt,
					timestamp: new Date().toISOString()
				});

				return connection;
			} catch (error) {
				this.logger.register("Warn", "CONNECTION_MANAGER", {
					service: name,
					action: "connection_attempt_failed",
					attempt,
					error: error.message,
					timestamp: new Date().toISOString()
				});
				
				if (attempt < finalConfig.maxRetries) {
					const delay = finalConfig.retryDelay * attempt; // Linear backoff
					this.logger.register("Info", "CONNECTION_MANAGER", {
						service: name,
						action: "retry_delay",
						delay,
						timestamp: new Date().toISOString()
					});
					await new Promise(resolve => setTimeout(resolve, delay));
				} else {
					throw error;
				}
			}
		}

		throw new Error(`Failed to connect ${name} after ${finalConfig.maxRetries} attempts`);
	}

	/**
	 * Valida se conexão ainda está ativa
	 */
	async validateConnection<T>(
		name: string,
		validator: (connection: T) => Promise<boolean>
	): Promise<boolean> {
		const connection = this.connections.get(name);
		
		if (!connection || this.connectionStatus.get(name) !== 'connected') {
			return false;
		}

		try {
			const isValid = await validator(connection);
			if (!isValid) {
				this.markConnectionAsInvalid(name);
			}
			return isValid;
		} catch (error) {
			this.logger.register("Warn", "CONNECTION_MANAGER", {
				service: name,
				action: "validation_failed",
				error: error.message,
				timestamp: new Date().toISOString()
			});
			this.markConnectionAsInvalid(name);
			return false;
		}
	}

	/**
	 * Marca conexão como inválida e remove do cache
	 */
	private markConnectionAsInvalid(name: string): void {
		this.connections.delete(name);
		this.connectionStatus.set(name, 'error');
		this.logger.register("Warn", "CONNECTION_MANAGER", {
			service: name,
			action: "connection_marked_invalid",
			timestamp: new Date().toISOString()
		});
	}

	/**
	 * Força desconexão
	 */
	async disconnect(name: string): Promise<void> {
		const connection = this.connections.get(name);
		
		if (connection) {
			try {
				// Se a conexão tem método close/disconnect, chama
				if (typeof connection.close === 'function') {
					await connection.close();
				} else if (typeof connection.disconnect === 'function') {
					await connection.disconnect();
				} else if (typeof connection.destroy === 'function') {
					await connection.destroy();
				}
			} catch (error) {
				this.logger.register("Warn", "CONNECTION_MANAGER", {
					service: name,
					action: "disconnect_error",
					error: error.message,
					timestamp: new Date().toISOString()
				});
			}
		}

		// SEMPRE remove do cache, mesmo se disconnect falhou
		this.connections.delete(name);
		this.connectionPromises.delete(name);
		this.connectionStatus.set(name, 'disconnected');
		
		this.logger.register("Info", "CONNECTION_MANAGER", {
			service: name,
			action: "disconnected",
			timestamp: new Date().toISOString()
		});
	}

	/**
	 * Status de todas as conexões
	 */
	getConnectionStatus(): Record<string, string> {
		const status: Record<string, string> = {};
		for (const [name, connectionStatus] of this.connectionStatus) {
			status[name] = connectionStatus;
		}
		return status;
	}

	/**
	 * Cleanup de conexões inativas
	 */
	async cleanup(): Promise<void> {
		const promises: Promise<void>[] = [];
		
		for (const name of this.connections.keys()) {
			if (this.connectionStatus.get(name) === 'error') {
				promises.push(this.disconnect(name));
			}
		}

		await Promise.allSettled(promises);
		this.logger.register("Info", "CONNECTION_MANAGER", {
			action: "cleanup_completed",
			timestamp: new Date().toISOString()
		});
	}
}