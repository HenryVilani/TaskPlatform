/**
 * Defines the possible types of log entries.
 */
export type LoggerType = "Error" | "Warn" | "Info";

/**
 * Interface for logging repository operations.
 */
export interface ILoggerRepository {
	/**
	 * Registers a log entry.
	 * @param type The type/severity of the log entry (Error, Warn, Info).
	 * @param id Unique identifier for the log entry (http_error...).
	 * @param data Additional data associated with the log entry.
	 */
	register(type: LoggerType, id: string, data: object): void;
}
