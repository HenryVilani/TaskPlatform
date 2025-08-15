import { Inject } from "@nestjs/common";
import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { type IAuthRepository } from "src/application/repositories/auth.repository";

@WebSocketGateway({
	namespace: "/notify"
})
export class NotifyGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

	constructor(
		@Inject("IAuthRepository") private readonly authRepository: IAuthRepository
	) {}
	
	@WebSocketServer()
	private server: Server

	afterInit(server: any) {}

	async handleConnection(socket: Socket) {

		const token: string | null  = socket.handshake.headers.authorization?.split(" ")[1] ?? null
		if (!token) return socket.disconnect(true);

		try {

			const user = await this.authRepository.validateToken(token);
			await socket.join(`user:${user.sub}`);
			console.log(`[SOCKET] ${user.sub} in room`);

			socket.to(`user:${user.sub}`).emit("task:notify", "NOTFI", (erro) => {

				console.log("err: ", erro)

			})

		}catch (error) {

			return socket.disconnect(true);

		}

	}

	handleDisconnect(client: any) {}


}
