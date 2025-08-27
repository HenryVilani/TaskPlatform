import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { IHealthService, HealthServiceStatus } from "src/application/services/health-service.repository";
import LokiTransport from "winston-loki";
import axios from "axios";
import { ModuleRef, LazyModuleLoader } from "@nestjs/core";
import type { HealthCheckService } from "src/infrastructure/health/health-check.service";
import type { ConnectionManager } from "src/infrastructure/health/connection-manager";

/**
 * LokiBaseServiceImpl with Lazy Loading
 * 
 * Uses lazy loading to resolve circular dependencies between modules.
 * Services are loaded on-demand after full application initialization.
 * 
 * Lazy Loading Strategy:
 * - HealthCheckService and ConnectionManager are loaded lazily
 * - No direct injection in constructor to avoid circular dependencies
 * - Services are resolved when first needed
 * - Graceful fallback if services are not available
 * 
 * @export
 * @class LokiBaseServiceImpl
 * @implements {IHealthService}
 * @implements {OnModuleInit}
 * @implements {OnModuleDestroy}
 */
@Injectable()
export class LokiBaseServiceImpl implements IHealthService, OnModuleInit, OnModuleDestroy {

	/**
	 * Connection name identifier for the Loki service
	 * @private
	 * @readonly
	 */
	private readonly connectionName = "log";

	/**
	 * Lazily loaded HealthCheckService instance
	 * @private
	 */
	private healthCheckService: HealthCheckService | null = null;

	/**
	 * Lazily loaded ConnectionManager instance
	 * @private
	 */
	private connectionManager: ConnectionManager | null = null;

	/**
	 * Flag to track if lazy loading has been attempted
	 * @private
	 */
	private servicesLoaded = false;

	/**
	 * Constructor with lazy module loader for resolving circular dependencies.
	 * 
	 * @param {ModuleRef} moduleRef - Module reference for service resolution
	 * @param {LazyModuleLoader} lazyModuleLoader - Lazy module loader for dynamic imports
	 */
	constructor(
		private readonly moduleRef: ModuleRef,
	) {}

	/**
	 * Lifecycle hook called after module initialization.
	 * Initiates lazy loading of required services.
	 * 
	 * @returns {Promise<void>}
	 */
	async onModuleInit() {
		
		setTimeout(() => {
			this.loadServicesLazily();
		}, 100);

		// Attempt to create initial Loki connection
		try {
			await this.getService<LokiTransport>();
			console.log('[LokiBaseService] Loki health service initialized successfully');
		} catch (error) {
			console.warn('[LokiBaseService] Initial Loki connection failed:', error.message);
		}
	}

	/**
	 * Lifecycle hook called before module destruction.
	 * @returns {Promise<void>}
	 */
	async onModuleDestroy() {
		console.log('[LokiBaseService] Shutting down Loki health service...');
		
		if (this.connectionManager) {
			await this.connectionManager.disconnect(this.connectionName);
		}
		
		console.log('[LokiBaseService] Loki health service shutdown complete');
	}

	/**
	 * Lazily loads required services to avoid circular dependencies.
	 * Uses multiple fallback strategies to resolve services.
	 * 
	 * @private
	 * @returns {Promise<void>}
	 */
	private async loadServicesLazily(): Promise<void> {
		if (this.servicesLoaded) return;

		console.log('[LokiBaseService] Attempting lazy service loading...');

		try {
			
			await this.loadFromCurrentContext();
			
			this.servicesLoaded = true;

			if (this.healthCheckService) {
				this.healthCheckService.register(this.connectionName, this);
				console.log('[LokiBaseService] Successfully registered with HealthCheckService');
			} else {
				console.warn('[LokiBaseService] HealthCheckService not available, continuing without health monitoring');
			}

		} catch (error) {
			console.error('[LokiBaseService] Failed to load services lazily:', error.message);
			this.servicesLoaded = true;
		}
	}

	private async loadFromCurrentContext(): Promise<void> {
		try {
			// Try to get services from current module context
			this.healthCheckService = this.moduleRef.get('HealthCheckService', { strict: false });
			this.connectionManager = this.moduleRef.get('ConnectionManager', { strict: false });
			
			console.log('[LokiBaseService] Loaded services from current context');
		} catch (error) {
			console.log('[LokiBaseService] Current context loading failed, trying next strategy...');
		}
	}

	/**
	 * Safe getter for HealthCheckService
	 * @private
	 */
	private async getHealthCheckService(): Promise<HealthCheckService | null> {
		if (!this.servicesLoaded) {
			await this.loadServicesLazily();
		}
		return this.healthCheckService;
	}

	/**
	 * Safe getter for ConnectionManager
	 * @private
	 */
	private async getConnectionManager(): Promise<ConnectionManager | null> {
		if (!this.servicesLoaded) {
			await this.loadServicesLazily();
		}
		return this.connectionManager;
	}

	/**
	 * Health check implementation - works with or without ConnectionManager
	 * @returns {Promise<HealthServiceStatus>}
	 */
	async isHealth(): Promise<HealthServiceStatus> {
		const url = (process.env.LOKI_URL ?? "http://localhost:3100") + "/ready";

		try {
			await axios.get(url, { timeout: 2000 });
			return "Health";
		} catch (error) {
			return "UnHealth";
		}
	}

	/**
	 * Gets the Loki service - uses ConnectionManager if available, fallback otherwise
	 * @template T
	 * @returns {Promise<T | null>}
	 */
	async getService<T>(): Promise<T | null> {
		const healthStatus = await this.isHealth();
		if (healthStatus !== "Health") {
			return null;
		}

		const connectionManager = await this.getConnectionManager();
		
		if (connectionManager) {
			// Use ConnectionManager if available
			const loki = await connectionManager.getConnection<LokiTransport>(
				this.connectionName,
				() => this.createLokiConnection(),
				{
					connectionTimeout: 3000,
					maxRetries: 2,
					retryDelay: 1000
				}
			);
			return loki as T;
		} else {
			// Fallback: direct connection creation
			console.log('[LokiBaseService] ConnectionManager not available, creating direct connection');
			try {
				const loki = await this.createLokiConnection();
				return loki as T;
			} catch (error) {
				console.error('[LokiBaseService] Failed to create direct connection:', error.message);
				return null;
			}
		}
	}

	/**
	 * Gets a healthy Loki connection for loggers
	 * @returns {Promise<LokiTransport | null>}
	 */
	async getHealthyConnection(): Promise<LokiTransport | null> {
		try {
			const healthStatus = await this.isHealth();
			if (healthStatus !== "Health") {
				return null;
			}
			return await this.getService<LokiTransport>();
		} catch (error) {
			console.error('[LokiBaseService] Error getting healthy connection:', error.message);
			return null;
		}
	}

	/**
	 * Creates a new LokiTransport instance
	 * @private
	 */
	private async createLokiConnection(): Promise<LokiTransport> {
		console.log('[LokiBaseService] Creating new Loki transport connection...');

		const loki = new LokiTransport({
			host: process.env.LOKI_URL ?? "http://localhost:3100",
			labels: { 
				service: process.env.SERVICE_NAME ?? "my-service",
				environment: process.env.NODE_ENV ?? "development"
			},
			json: true,
			batching: false,
			timeout: 3000
		});

		// Error handling
		loki.on('error', (err) => {
			console.error('[LokiBaseService] Loki transport error:', err.message);
		});

		loki.on('warn', (warning) => {
			console.warn('[LokiBaseService] Loki transport warning:', warning);
		});

		// Verify health before returning
		const health = await this.isHealth();
		if (health !== "Health") {
			throw new Error("Cannot create Loki connection - service is unhealthy");
		}

		console.log('[LokiBaseService] Loki transport connection created successfully');
		return loki;
	}

	/**
	 * Forces a reset of connections
	 * @returns {Promise<void>}
	 */
	async resetConnection(): Promise<void> {
		console.log('[LokiBaseService] Resetting Loki connections...');
		
		const connectionManager = await this.getConnectionManager();
		if (connectionManager) {
			await connectionManager.disconnect(this.connectionName);
		}
		
		console.log('[LokiBaseService] Loki connection reset completed');
	}
}