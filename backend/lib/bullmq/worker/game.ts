// src/workers/game.worker.ts
import { ConnectionOptions, Worker } from "bullmq";
import { io } from "../../socket";
import redis from "../../redis";
import { prisma } from "../../prisma";
import { gameQueue } from "../queue/game";
import { quanbits } from "../../AI/AI";

export const gameWorker = new Worker(
  "game-queue",
  async (job) => {
    const { gameId, action } = job.data;

    if (action === "start") {
      const game = await prisma.game.update({
        where: { id: gameId },
        data: { active: true, startAt: new Date() }, // 10 minutes
      });

      gameQueue.add(
        "game-queue",
        {
          gameId,
          action: "end",
        },
        {
          delay: game.duration! * 1000, // 10 minutes
        },
      );
      io.to(gameId).emit("game:started");
    }

    if (action === "end") {
      await prisma.game.update({
        where: { id: gameId },
        data: { active: false, close: true, endAt: new Date() },
      });

      const players = await prisma.player.findMany({
        where: {
          gameId,
        },
      });

      prisma.player.updateMany({
        where: {
          gameId,
        },
        data: {
          kicked: true,
        },
      });

      players.forEach((player) => {
        quanbits.delete(player.id);
      });

      io.to(gameId).emit("game:ended");
    }
  },
  { connection: redis as ConnectionOptions },
);
