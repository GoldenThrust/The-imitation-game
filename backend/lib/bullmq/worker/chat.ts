// src/workers/chat.worker.ts
import { ConnectionOptions, Worker } from "bullmq";
import redis from "../../redis";

export const chatWorker = new Worker(
  "chat-queue",
  async (job) => {
    // optional:
    // - moderation
    // - sentiment tracking
    // - suspicion scoring
  },
  { connection: redis as ConnectionOptions }
);