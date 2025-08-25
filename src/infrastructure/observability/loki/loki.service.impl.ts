import LokiTransport from "winston-loki";
import { createLogger, Logger } from "winston"
import { HttpErrorCounter } from "../prometheus/prometheus-metrics"
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ILoggerRepository, LoggerType } from "src/application/services/logger.repository";
import { LokiBaseServiceImpl } from "./loki.health";

/**
 * LokiServiceImpl
 * 
 * Loki logging service implementation that provides structured logging capabilities
 * through Winston and Loki integration. This is the actual logging service that
 * controllers and other parts of the application use.
 * 
 * Architecture:
 * - Uses LokiBaseServiceImpl for health management and connection handling
 * - Implements ILoggerRepository interface for standardized logging
 * - Provides Winston logger integration with Loki transport
 * 
 * Dependency Resolution:
 * - Depends on LokiBaseServiceImpl (which uses CoreModule services)
 * - No circular dependencies as it doesn't depend on HealthCheckService directly
 * - Safe to inject into controllers and other application services
 * 
 * Logging Levels:
 * - Info: General information, successful operations
 * - Warn: Warning conditions, potential issues
 * - Error: Error conditions, failed operations
 * 
 * @export
 * @class LokiServiceImpl
 * @implements {ILoggerRepository}
 * @implements {OnModuleInit}
 */
@Injectable()
export class LokiServiceImpl implements ILoggerRepository, OnModuleInit {

	/**
	 * Winston transport used to send logs to Loki
	 * Managed through LokiBaseServiceImpl for health checking
	 * @private
	 * @type {LokiTransport | null}
	 */
	private transporter: LokiTransport | null = null;

	/**
	 * Standard Winston logger instance
	 * Created with Loki transport when available
	 * @private
	 * @type {Logger | null}
	 */
	private logger: Logger | null = null;

	/**
	 * Constructor for Loki logging service.
	 * 
	 * @param {LokiBaseServiceImpl} lokiService - Base Loki service for health management and connections
	 */
	constructor(
		private readonly lokiService: LokiBaseServiceImpl
	) {}

	/**
	 * Called automatically by NestJS after the module is initialized.
	 * Sets up the connection to Loki and creates the Winston logger.
	 * 
	 * Initialization Process:
	 * 1. Attempts to get healthy Loki transport from LokiBaseServiceImpl
	 * 2. Creates Winston logger with Loki transport if available
	 * 3. Falls back gracefully if Loki is not available
	 * 
	 * Error Handling:
	 * - Continues without throwing if Loki is unavailable
	 * - Allows application to start even with logging issues
	 * - Provides fallback behavior for resilience
	 * 
	 * @returns {Promise<void>}
	 */
	async onModuleInit() {
		console.log('[LokiService] Initializing Loki logging service...');

		try {
			// Get Loki transport from the health service
			const transport = await this.lokiService.getService<LokiTransport>();
			
			if (!transport) {
				console.warn('[LokiService] Loki transport not available, logging will be limited');
				this.transporter = null;
				this.logger = null;
				return;
			}

			// Set up Winston logger with Loki transport
			this.transporter = transport;
			this.logger = createLogger({
				transports: [this.transporter]
			});

			console.log('[LokiService] Loki logging service initialized successfully');

		} catch (error) {
			console.error('[LokiService] Failed to initialize Loki logging service:', error.message);
			this.transporter = null;
			this.logger = null;
		}
	}

	/**
	 * Registers a log message with the logger.
	 * Supports different log levels and provides fallback logging.
	 * 
	 * Behavior:
	 * - Uses Winston/Loki logger if available
	 * - Falls back to console logging if Loki is unavailable
	 * - Continues without throwing errors to maintain application stability
	 * 
	 * Log Levels:
	 * - Info: General information and successful operations
	 * - Warn: Warning conditions that should be noted
	 * - Error: Error conditions that need attention
	 * 
	 * @param {LoggerType} type - The log level (Info, Warn, Error)
	 * @param {string} id - A unique identifier or title for the log entry
	 * @param {object} data - The payload or context object to log
	 */
	register(type: LoggerType, id: string, data: object) {
		// Primary logging through Winston/Loki if available
		if (this.logger) {
			try {
				switch (type) {
					case "Info":
						this.logger.info(id, data);
						break;
					case "Warn":
						this.logger.warn(id, data);
						break;
					case "Error":
						this.logger.error(id, data);
						break;
					default:
						console.warn(`[LokiService] Unknown log type: ${type}`);
						return;
				}
				return;
			} catch (error) {
				console.error('[LokiService] Failed to log to Loki, falling back to console:', error.message);
			}
		}

		// Fallback to console logging
		const logMessage = `[${type}] ${id}: ${JSON.stringify(data)}`;
		switch (type) {
			case "Info":
				console.log(logMessage);
				break;
			case "Warn":
				console.warn(logMessage);
				break;
			case "Error":
				console.error(logMessage);
				break;
			default:
				console.log(logMessage);
		}
	}

	/**
	 * Checks if the Loki logger is currently available and functional.
	 * Useful for conditional logging or health checks.
	 * 
	 * @returns {boolean} True if logger is available, false otherwise
	 */
	isAvailable(): boolean {
		return this.logger !== null && this.transporter !== null;
	}

	/**
	 * Attempts to reinitialize the Loki connection.
	 * Useful for recovery scenarios when Loki becomes available again.
	 * 
	 * @returns {Promise<boolean>} True if reinitialization was successful
	 */
	async reinitialize(): Promise<boolean> {
		console.log('[LokiService] Attempting to reinitialize Loki connection...');
		
		try {
			await this.onModuleInit();
			const success = this.isAvailable();
			
			if (success) {
				console.log('[LokiService] Loki connection reinitialized successfully');
			} else {
				console.warn('[LokiService] Loki connection reinitialization failed');
			}
			
			return success;
		} catch (error) {
			console.error('[LokiService] Error during reinitialization:', error.message);
			return false;
		}
	}
}