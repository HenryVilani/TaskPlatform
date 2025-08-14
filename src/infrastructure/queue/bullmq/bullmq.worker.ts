
import { Logger } from "@nestjs/common";
import { Worker } from "bullmq";
import {Redis} from "ioredis";

export const initWorker = (connection: Redis) => {

	console.log("INIT WORKER")
	
	const worker = new Worker("notify-task", async job => {

		console.log(job.data);
		Logger.log("OI")

	}, { connection });

	worker.on('completed', job => {

		Logger.log("COMPLETED");

	})

	worker.on('failed', job => {

		Logger.log("failed");

	})

}
