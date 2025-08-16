import { Inject, OnModuleInit } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import Redis from "ioredis";
import { Server, Socket } from "socket.io";
import { StatusDTO } from "src/application/dtos/status.dto";
import { type IAuthRepository } from "src/application/repositories/auth.repository";
import { type ITaskRepository } from "src/application/repositories/task.repository";
import { type IUserRepository } from "src/application/repositories/user.respotory";
import { WSTaskDTO } from "./dto/notify.dto";


@WebSocketGateway({
	namespace: "/notify",
	cors: {
		credentials: true,
		origin: "*",
		methods: ["GET", "POST"]
	}
})
export class NotifyGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {

	@WebSocketServer()
	private server: Server
	private redisSub: Redis;

	constructor(
		@Inject("IAuthRepository") private readonly authRepository: IAuthRepository,
		@Inject("ITaskRepository") private readonly taskRepository: ITaskRepository,
		@Inject("IUserRepository") private readonly userRepository: IUserRepository
	) {}
	

	async onModuleInit() {

		this.redisSub = new Redis({
			host: process.env.REDIS_HOST ?? "127.0.0.1",
			port: Number(process.env.REDIS_PORT) ?? 6379,
			maxRetriesPerRequest: null
		});

		this.redisSub.psubscribe("user:*:notifications");
		this.redisSub.on('pmessage', this.subscriberCallback.bind(this));
		console.log("[NotifyGateway] onModuleInit")

	}

	afterInit(server: Server) {}

	async handleConnection(socket: Socket) {

		const token: string | null  = socket.handshake.auth.token;
		if (!token) {

			this.server.emit("task:notify", new StatusDTO("unauthorized"));
			return socket.disconnect(true);

		};

		try {

			const user = await this.authRepository.validateToken(token);
			await socket.join(`user:${user.sub}`);
			console.log("+ handleConncetion")
			
		}catch (error) {

			return socket.disconnect(true);

		}

	}

	handleDisconnect(client: any) {}


	private async subscriberCallback(pattern: string, channel: string, message: string) {

		console.log("Callback")

		try {

			const userId = channel.split(":")[1];
			const wsTask: WSTaskDTO = JSON.parse(message);

			const user = await this.userRepository.findById(userId);
			if (!user) {

				console.log("User - none");
				return;
			}

			const dbTask = await this.taskRepository.findById(user, wsTask.id);
			if (!dbTask) {

				console.log("DBTask - none");
				return;

			}

			console.log(`SEND: user:${userId}`)
			this.server.to(`user:${userId}`).emit("task:notify", wsTask);
			
			dbTask.markAsSent();
			await this.taskRepository.update(user, dbTask);
		
		}catch (error) {

			console.log("ERROR: ", error);

		}

	}


}
