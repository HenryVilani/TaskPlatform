import LokiTransport from "winston-loki";
import { createLogger, Logger } from "winston"
import { HttpErrorCounter } from "../prometheus/prometheus-metrics"
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ILoggerRepository, LoggerType } from "src/application/services/logger.repository";
import { LokiBaseServiceImpl } from "./loki.health";


@Injectable()
export class LokiServiceImpl implements ILoggerRepository, OnModuleInit {

	// Winston transport used to send logs to Loki
	private transporter: LokiTransport | null = null;

	// Standard Winston logger instance
	private logger: Logger | null = null;

	constructor(
		private readonly lokiService: LokiBaseServiceImpl
	) {}

	/**
	 * Called automatically by NestJS after the module is initialized.
	 * Sets up the connection to Loki and creates the logger.
	 * Retries every 15 seconds if connection fails, up to a maximum number of attempts.
	 */
	async onModuleInit() {

		const transport = await this.lokiService.getService<LokiTransport>();
		if (!transport) {
			this.transporter = null;
			this.logger = null;
			return;
		}

		this.transporter = transport;
	
		this.logger = createLogger({
			transports: [this.transporter]
		});

	}


	/**
	 * Registers a log message with the logger.
	 * Supports different log levels: Info, Warn, and Error.
	 * @param type The log level (Info, Warn, Error)
	 * @param id A unique identifier or title for the log
	 * @param data The payload or context object to log
	 */
	register(type: LoggerType, id: string, data: object) {

		if (!this.logger) return;

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
