import { io } from "socket.io-client";

const socket = io("http://localhost:3000/notify", {
  extraHeaders: {
	"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMUsyUUtaMTdQQUg1OTlESjVOUjBHTjBCSyIsImVtYWlsIjp7ImVtYWlsVmFsdWUiOiJ0ZXN0QGdtYWlsLmNvbSJ9LCJpYXQiOjE3NTUyOTA1NjR9.6IpJ6ayywMY3EuCEBGFltWkwjA_mmjmsgQGbCcmA_E8"
  }
});

socket.on("connect", () => {
  console.log("Conectado", socket.id);
});

socket.on("task:notify", (data) => {
  console.log("Recebi notificação:", data);
});