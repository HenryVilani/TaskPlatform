import * as client from "prom-client"

// Counter for tracking total HTTP exceptions in the application
// Labels include status code, HTTP method, and request path
export const HttpErrorCounter = new client.Counter({
	name: 'http_exceptions_total',
	help: 'Total HTTP Exceptions in NestJS',
	labelNames: ['status', 'method', 'path'],
});

// Counter for tracking the total number of jobs added to a queue
export const QueueJobCounter = new client.Counter({
	name: "queue_job_total",
	help: "Total jobs in queue"
})

// Counter for tracking the total number of tasks that have been notified/sent
export const TaskSentCounter = new client.Counter({
	name: "task_sent_total",
	help: "Total tasks notified"
})
