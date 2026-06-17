// src/queues/chat.queue.ts
import { ConnectionOptions, Queue } from "bullmq";
import redis from "../../redis.js";

export const chatQueue = new Queue("chat-queue", {
  connection: redis as ConnectionOptions,
});