import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
	namespace: "/notify"
})
export class NotifyGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

	constructor() {}
	
	@WebSocketServer()
	private server: Server

	afterInit(server: any) {}

	handleConnection(client: Socket, ...args: any[]) {}

	handleDisconnect(client: any) {}

	@SubscribeMessage("message")
	handleMessage(@MessageBody() data: string): void {}

}
