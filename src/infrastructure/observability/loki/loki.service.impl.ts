import LokiTransport from "winston-loki";
import { createLogger, Logger } from "winston"
import { HttpErrorCounter } from "../prometheus/prometheus-metrics.service"
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ILoggerRepository, LoggerType } from "src/application/services/logger.repository";


@Injectable()
export class LokiServiceImpl implements ILoggerRepository, OnModuleInit {

	// Winston transport used to send logs to Loki
	private transporter: LokiTransport;

	// Standard Winston logger instance
	private logger: Logger;

	constructor() {}

	/**
	 * Called automatically by NestJS after the module is initialized.
	 * Sets up the connection to Loki and creates the logger.
	 * Retries every 15 seconds if connection fails, up to a maximum number of attempts.
	 */
	onModuleInit() {

		const maxAttempts = 10; // Maximum number of reconnection attempts
		let attempts = 0;

		const tryId = setInterval(() => {

			attempts++;

			// Stop retrying if maximum attempts are reached, increment Prometheus counter
			if (attempts > maxAttempts) {
				clearInterval(tryId);
				HttpErrorCounter.inc();
			}

			try {
				// Create the Loki transport for Winston
				this.transporter = new LokiTransport({
					host: "http://localhost:3100",
					labels: {
						app: "backend-app"
					},
					json: true,
					onConnectionError: () => {
						// Increment Prometheus counter on connection error
						HttpErrorCounter.inc();
					}
				});

				// Create the Winston logger using the configured transport
				this.logger = createLogger({
					transports: [this.transporter]
				});

				// Successfully connected, stop retry interval
				clearInterval(tryId)

			} catch {
				// Error while initializing transport, increment Prometheus counter
				HttpErrorCounter.inc();
			}

		}, 15000); // Retry every 15 seconds

	}

	/**
	 * Registers a log message with the logger.
	 * Supports different log levels: Info, Warn, and Error.
	 * @param type The log level (Info, Warn, Error)
	 * @param id A unique identifier or title for the log
	 * @param data The payload or context object to log
	 */
	register(type: LoggerType, id: string, data: object) {

		// Also print to console for immediate visibility
		console.log(`${type} - ${id} -> ${JSON.stringify(data)}`)

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
				return;
		}

	}

}
