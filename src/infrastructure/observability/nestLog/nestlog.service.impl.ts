import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ILoggerRepository, LoggerType } from "src/application/services/logger.repository";

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
export class NestLogServiceImpl implements ILoggerRepository, OnModuleInit {


	/**
	 * NestJS Logger instance
	 * Created with Loki transport when available
	 * @private
	 * @type {Logger | null}
	 */
	private logger: Logger = new Logger();


	constructor() {}

	async onModuleInit() {}

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
		
		switch (type) {
			case "Info":
				this.logger.log(id, JSON.stringify(data));
				break;
			case "Warn":
				this.logger.warn(id, JSON.stringify(data));
				break;
			case "Error":
				this.logger.error(id, JSON.stringify(data));
				break;
			default:
				this.logger.warn(`[Logger] Unknown log type: ${type}`);
				return;
		}

	}

	/**
	 * Checks if the Loki logger is currently available and functional.
	 * Useful for conditional logging or health checks.
	 * 
	 * @returns {boolean} True if logger is available, false otherwise
	 */
	isAvailable(): boolean {
		return true;
	}

	/**
	 * Attempts to reinitialize the Loki connection.
	 * Useful for recovery scenarios when Loki becomes available again.
	 * 
	 * @returns {Promise<boolean>} True if reinitialization was successful
	 */
	async reinitialize(): Promise<boolean> {
		return true;
	}
}