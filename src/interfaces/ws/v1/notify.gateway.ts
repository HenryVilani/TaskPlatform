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

	/** @type {Redis} Redis subscriber instance */
	private redisSub: Redis;

	constructor(
		@Inject("IAuthRepository") private readonly authRepository: IAuthRepository,
		@Inject("ITaskRepository") private readonly taskRepository: ITaskRepository,
		@Inject("IUserRepository") private readonly userRepository: IUserRepository,
		@Inject("ISchedulerRepository") private readonly scheduleRepository: ISchedulerRepository,
	) {}

	/**
	 * Initializes the Redis subscriber and subscribes to user notification channels.
	 * This method is called when the module is initialized.
	 */
	async onModuleInit() {
		this.redisSub = new Redis({
			host: process.env.REDIS_HOST ?? "127.0.0.1",
			port: Number(process.env.REDIS_PORT) ?? 6379,
			maxRetriesPerRequest: null
		});

		await this.redisSub.ping();

		// Subscribe to all user notification channels
		this.redisSub.psubscribe("user:*:notifications");

		// Handle incoming Redis messages
		this.redisSub.on('pmessage', (pattern: string, channel: string, message: string) => {
			console.log(`[Redis] Received message on pattern: ${pattern}, channel: ${channel}`);
			this.subscriberCallback(pattern, channel, message);
		});
	}

	/**
	 * Lifecycle hook called after the WebSocket server is initialized.
	 * @param {Server} server - The initialized Socket.IO server
	 */
	afterInit(server: Server) {}

	/**
	 * Handles new WebSocket connections.
	 * Validates the provided token and joins the user to a personal room.
	 * @param {Socket} socket - The connected client socket
	 */
	async handleConnection(socket: Socket) {
		const token: string | null = socket.handshake.auth.token;

		if (!token) {
			console.log("Connection rejected: No token provided");
			socket.emit("error", new StatusDTO("unauthorized"));
			return socket.disconnect(true);
		}

		try {
			const user = await this.authRepository.validateToken(token);
			await socket.join(`user:${user.sub}`);
			console.log(`+ User ${user.sub} connected to room: user:${user.sub}`);
		} catch (error) {
			console.log("Connection rejected: Invalid token", error);
			return socket.disconnect(true);
		}
	}

	/**
	 * Handles WebSocket disconnections.
	 * @param {Socket} socket - The disconnected client socket
	 */
	handleDisconnect(socket: Socket) {}

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
				console.log("Invalid channel format:", channel);
				return;
			}

			const userId = channelParts[1];

			const wsTask: WSNotifyDTO = WSNotifyDTO.fromTask(JSON.parse(message));

			const user = await this.userRepository.findById(userId);
			if (!user) {
				console.log("User not found:", userId);
				return;
			}

			const dbTask = await this.taskRepository.findById(user, wsTask.id);
			if (!dbTask) {
				console.log("Task not found:", wsTask.id);
				return;
			}

			// Emit the task notification to the user's room
			this.server.to(`user:${userId}`).emit("task:notify", wsTask);

			// Update task status based on notifyType
			if (dbTask.notifyType == "OneTime") {
				dbTask.markAsSent();
				if (dbTask.jobId) {
					await this.scheduleRepository.removeSchedule(dbTask.jobId);
					dbTask.jobId = null;
				}
			} else if (dbTask.notifyType == "EveryTime") {
				dbTask.markAsScheduled();
			}

			await this.taskRepository.update(user, dbTask);

		} catch (error) {
			console.error("[SubscriberCallback] Error processing notification:", error);
		}
	}

	/**
	 * Handles a "ping" WebSocket message and responds with "pong".
	 * @param {Socket} socket - The client socket that sent the ping
	 */
	@SubscribeMessage('ping')
	handlePing(socket: Socket): void {
		socket.emit('pong', 'Gateway is working');
	}
}
