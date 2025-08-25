import { Inject, OnModuleInit } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import Redis from "ioredis";
import { Server, Socket } from "socket.io";
import { StatusDTO } from "src/application/dtos/status.dto";
import { type IAuthRepository } from "src/application/repositories/auth.repository";
import { type ITaskRepository } from "src/application/repositories/task.repository";
import { type IUserRepository } from "src/application/repositories/user.respotory";
import { WSNotifyDTO } from "./dto/notify.dto";
import { type ISchedulerRepository } from "src/application/services/scheduler.repository";
import { HttpErrorCounter } from "src/infrastructure/observability/prometheus/prometheus-metrics";
import { HealthCheckService } from "src/infrastructure/health/health-check.service";
import { RedisServiceImpl } from "src/infrastructure/queue/bullmq/redis.impl";
import { LokiServiceImpl } from "src/infrastructure/observability/loki/loki.service.impl";
import { ConnectionManager } from "src/infrastructure/health/connection-manager";
import { ILoggerRepository } from "src/application/services/logger.repository";
import { NestLogServiceImpl } from "src/infrastructure/observability/nestLog/nestlog.service.impl";

/**
 * WebSocket Gateway for task notifications.
 * 
 * This gateway handles user connections via WebSocket and listens for Redis pub/sub
 * messages to notify users in real-time about task updates.
 */
@WebSocketGateway({
	namespace: "/notify",
	cors: {
		credentials: true,
		origin: "*",
		methods: ["GET", "POST"]
	}
})
export class NotifyGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {

	/** @type {Server} Socket.IO server instance */
	@WebSocketServer()
	private server: Server;

	private logger: ILoggerRepository | null = null;

	constructor(
		@Inject("IAuthRepository") private readonly authRepository: IAuthRepository,
		@Inject("ITaskRepository") private readonly taskRepository: ITaskRepository,
		@Inject("IUserRepository") private readonly userRepository: IUserRepository,
		@Inject("ISchedulerRepository") private readonly scheduleRepository: ISchedulerRepository,
		private readonly healthCheck: HealthCheckService,
		private readonly connectionManager: ConnectionManager
	) {}

	/**
	 * Initializes the Redis subscriber and subscribes to user notification channels.
	 * This method is called when the module is initialized.
	 */
	async onModuleInit() {

		this.logger = await this.connectionManager.getConnection<ILoggerRepository>("log", async () => new NestLogServiceImpl())

		this.logger?.register("Info", "WEBSOCKET_GATEWAY", {
			action: "initializing",
			timestamp: new Date().toISOString()
		});

		const redisService = this.healthCheck.getService<RedisServiceImpl>("redis");
		if (!redisService) {
			this.logger?.register("Warn", "WEBSOCKET_GATEWAY", {
				action: "initialization_skipped",
				reason: "redis_service_unavailable",
				timestamp: new Date().toISOString()
			});
			return;
		}

		const redis = await redisService.service.getService<Redis>();
		if (!redis) {
			this.logger?.register("Warn", "WEBSOCKET_GATEWAY", {
				action: "initialization_skipped",
				reason: "redis_unhealthy",
				timestamp: new Date().toISOString()
			});
			return;
		}

		redis.psubscribe("user:*:notifications");
		
		this.logger?.register("Info", "WEBSOCKET_GATEWAY", {
			action: "subscribed_to_redis_channels",
			pattern: "user:*:notifications",
			timestamp: new Date().toISOString()
		});
	
		// Handle incoming Redis messages
		redis.on('pmessage', (pattern: string, channel: string, message: string) => {
			this.subscriberCallback(pattern, channel, message);
		});

		this.logger?.register("Info", "WEBSOCKET_GATEWAY", {
			action: "initialized",
			timestamp: new Date().toISOString()
		});
	}

	/**
	 * Lifecycle hook called after the WebSocket server is initialized.
	 * @param {Server} server - The initialized Socket.IO server
	 */
	afterInit(server: Server) {
		this.logger?.register("Info", "WEBSOCKET_GATEWAY", {
			action: "websocket_server_initialized",
			timestamp: new Date().toISOString()
		});
	}

	/**
	 * Handles new WebSocket connections.
	 * Validates the provided token and joins the user to a personal room.
	 * @param {Socket} socket - The connected client socket
	 */
	async handleConnection(socket: Socket) {
		const token: string | null = socket.handshake.auth.token;

		if (!token) {
			this.logger?.register("Warn", "WEBSOCKET_GATEWAY", {
				action: "connection_rejected",
				reason: "no_token",
				socketId: socket.id,
				timestamp: new Date().toISOString()
			});
			socket.emit("error", new StatusDTO("unauthorized"));
			return socket.disconnect(true);
		}

		try {
			const user = await this.authRepository.validateToken(token);
			await socket.join(`user:${user.sub}`);
			
			this.logger?.register("Info", "WEBSOCKET_GATEWAY", {
				action: "user_connected",
				userId: user.sub,
				socketId: socket.id,
				timestamp: new Date().toISOString()
			});
		} catch (error) {
			this.logger?.register("Warn", "WEBSOCKET_GATEWAY", {
				action: "connection_rejected",
				reason: "invalid_token",
				socketId: socket.id,
				error: error.message,
				timestamp: new Date().toISOString()
			});
			return socket.disconnect(true);
		}
	}

	/**
	 * Handles WebSocket disconnections.
	 * @param {Socket} socket - The disconnected client socket
	 */
	handleDisconnect(socket: Socket) {
		this.logger?.register("Info", "WEBSOCKET_GATEWAY", {
			action: "user_disconnected",
			socketId: socket.id,
			timestamp: new Date().toISOString()
		});
	}

	/**
	 * Callback executed when a Redis message is received on a subscribed channel.
	 * Processes the message, validates the user and task, and emits the notification via WebSocket.
	 * @param {string} pattern - The Redis pattern that matched the message
	 * @param {string} channel - The Redis channel that sent the message
	 * @param {string} message - The message payload (task data)
	 */
	private async subscriberCallback(pattern: string, channel: string, message: string) {
		try {
			const channelParts = channel.split(":");
			if (channelParts.length !== 3 || channelParts[0] !== "user" || channelParts[2] !== "notifications") {
				this.logger?.register("Warn", "WEBSOCKET_GATEWAY", {
					action: "invalid_channel_format",
					channel,
					timestamp: new Date().toISOString()
				});
				return;
			}

			const userId = channelParts[1];

			const wsTask: WSNotifyDTO = WSNotifyDTO.fromTask(JSON.parse(message));

			const user = await this.userRepository.findById(userId);
			if (!user) {
				this.logger?.register("Warn", "WEBSOCKET_GATEWAY", {
					action: "user_not_found",
					userId,
					taskId: wsTask.id,
					timestamp: new Date().toISOString()
				});
				return;
			}

			const dbTask = await this.taskRepository.findById(user, wsTask.id);
			if (!dbTask) {
				this.logger?.register("Warn", "WEBSOCKET_GATEWAY", {
					action: "task_not_found",
					userId,
					taskId: wsTask.id,
					timestamp: new Date().toISOString()
				});
				return;
			}

			// Emit the task notification to the user's room
			this.server.to(`user:${userId}`).emit("task:notify", wsTask);

			this.logger?.register("Info", "WEBSOCKET_GATEWAY", {
				action: "notification_emitted",
				userId,
				taskId: wsTask.id,
				room: `user:${userId}`,
				timestamp: new Date().toISOString()
			});

			// Update task status based on notifyType
			if (dbTask.notifyType == "OneTime") {
				dbTask.markAsSent();
				if (dbTask.jobId) {
					await this.scheduleRepository.removeSchedule(dbTask.jobId);
					dbTask.jobId = null;
				}
				this.logger?.register("Info", "WEBSOCKET_GATEWAY", {
					action: "task_marked_as_sent",
					taskId: dbTask.id,
					notifyType: "OneTime",
					timestamp: new Date().toISOString()
				});
			} else if (dbTask.notifyType == "EveryTime") {
				dbTask.markAsScheduled();
				this.logger?.register("Info", "WEBSOCKET_GATEWAY", {
					action: "task_marked_as_scheduled",
					taskId: dbTask.id,
					notifyType: "EveryTime",
					timestamp: new Date().toISOString()
				});
			}

			await this.taskRepository.update(user, dbTask);

		} catch (error) {
			this.logger?.register("Error", "WEBSOCKET_GATEWAY", {
				action: "subscriber_callback_failed",
				channel,
				error: error.message,
				timestamp: new Date().toISOString()
			});
		}
	}

	/**
	 * Handles a "ping" WebSocket message and responds with "pong".
	 * @param {Socket} socket - The client socket that sent the ping
	 */
	@SubscribeMessage('ping')
	handlePing(socket: Socket): void {
		socket.emit('pong', 'Gateway is working');
		this.logger?.register("Info", "WEBSOCKET_GATEWAY", {
			action: "ping_handled",
			socketId: socket.id,
			timestamp: new Date().toISOString()
		});
	}
}