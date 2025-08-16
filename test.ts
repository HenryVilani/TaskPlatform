import { io } from "socket.io-client";

const socket = io("http://localhost:3000/notify", {
	auth: {
		token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMUsyU0gwTUVGU1hCMFBaUDBZMDAyNzhCOSIsImVtYWlsIjp7InZhbHVlIjoidGVzdEBnbWFpbC5jb20ifSwiaWF0IjoxNzU1MzU5ODUyfQ.4-SXw_5RIasv_go_joPbvq4oP2M0XBN7JjTj9ZwTxdE"
	}
});

socket.on("connect", () => {
	console.log("Conectado", socket.id);
});

socket.on("task:notify", (data) => {
	console.log("Recebi notificação:", data);
});