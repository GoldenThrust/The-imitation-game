// src/workers/game.worker.ts
import { ConnectionOptions, Worker } from "bullmq";
import { io } from "../../socket";
import redis from "../../redis";
import { prisma } from "../../prisma";
import { gameQueue } from "../queue/game";
import { quanbits } from "../../AI/AI";
import { GameType, Role } from "../../../generated/prisma/enums";

export const gameWorker = new Worker(
  "game-queue",
  async (job) => {
    try {
      const { gameId, action } = job.data;

      if (action === "start") {
        const gameAlreadyStarted = await prisma.game.findFirst({
          where: {
            id: gameId,
            startAt: {
              lte: new Date(),
            },
          },
        });

        if (gameAlreadyStarted) {
          console.warn(`Game ${gameId} already started.`);
          return;
        }
        const game = await prisma.game.update({
          where: { id: gameId },
          data: { active: false, startAt: new Date() },
        });

        gameQueue.add(
          "game-queue",
          {
            gameId,
            action: "end",
          },
          {
            delay: game.duration! * 1000,
          },
        );

        const players = await prisma.player.findMany({
          where: {
            gameId,
            kicked: false,
          },
        });

        const quanbitsPlayers = players.filter(
          (player) => player.role === Role.Quanbit,
        );

        quanbitsPlayers.forEach((player) => {
          const quanbit = quanbits.get(player.id);

          quanbit?.gameStarted();
        });

        if (game.type === GameType.NightFall && players.length < 10) {
        }
        io.to(gameId).emit("game:started");
      }

      if (action === "end") {
        await prisma.game.update({
          where: { id: gameId },
          data: { active: false, endAt: new Date() },
        });

        const players = await prisma.player.findMany({
          where: {
            gameId,
          },
        });

        players.forEach((player) => {
          quanbits.delete(player.id);
        });

        io.to(gameId).emit("game:ended");
      }
    } catch (error) {
      console.error("Error processing game job:", error);
    }
  },
  { connection: redis as ConnectionOptions, concurrency: 5 },
);
