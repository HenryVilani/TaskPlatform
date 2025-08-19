import { io } from "socket.io-client";

const socket = io("http://localhost:3000/notify", {
	auth: {
		token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMUsyVDA0WFBURTdHUEQ3WjZNMjI1UTdGRiIsImVtYWlsIjp7InZhbHVlIjoidGVzdEBnbWFpbC5jb20ifSwiaWF0IjoxNzU1MzY2NzIzfQ.zuMbEbaloBHwu4MBJ2IH9EZtHqKEOSJ3sh-4NsP0ipw"
	}
});

socket.on("connect", () => {
	console.log("Conectado", socket.id);
});

socket.on("task:notify", (data) => {
	console.log("Recebi notificação:", data);
});