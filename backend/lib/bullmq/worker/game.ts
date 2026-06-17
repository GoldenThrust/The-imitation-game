// src/workers/game.worker.ts
import { ConnectionOptions, Worker } from "bullmq";
import { io } from "../../socket";
import redis from "../../redis";
import { prisma } from "../../prisma";

export const gameWorker = new Worker(
    "game-queue",
    async (job) => {
        const { gameId, action } = job.data;

        if (action === "start") {
            await prisma.game.update({
                where: { id: gameId },
                data: { active: true, startAt: new Date() },
            });

            io.to(gameId).emit("game:started");
        }

        if (action === "end") {
            await prisma.game.update({
                where: { id: gameId },
                data: { active: false, close: true, endAt: new Date() },
            });

            io.to(gameId).emit("game:ended");
        }
    },
    { connection: redis as ConnectionOptions }
);