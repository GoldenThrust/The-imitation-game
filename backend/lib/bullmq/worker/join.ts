// src/workers/join.worker.ts
import { ConnectionOptions, Worker } from "bullmq";

import { io } from "../../socket";
import { humanJoinDelay, sleep } from "../../../utils";
import redis from "../../redis";
import { prisma } from "../../prisma";
import Quanbit, { quanbits } from "../../AI/AI";
import { GameType, Role } from "../../../generated/prisma/enums";
import { gameQueue } from "../queue/game";

export const joinWorker = new Worker(
  "join-queue",
  async (job) => {
    const { gameId, isAI } = job.data;

    if (isAI) {
      await sleep(humanJoinDelay());
    }

    let game = await prisma.game.findFirst({
      where: {
        id: gameId,
      },
    });

    if (!game) return;

    const players = await prisma.player.findMany({
      where: {
        gameId: gameId,
        kicked: false,
      },
    });

    if (
      (game.type === GameType.EyeFold && players.length >= 3) ||
      players.length >= 10
    ) {
      await prisma.game.update({
        where: {
          id: game.id,
        },
        data: {
          active: false,
        },
      });
      return;
    }

    const player = await prisma.player.create({
      data: {
        gameId: gameId,
        role: isAI ? Role.Quanbit : Role.Human,
      },
    });

    if (
      (game!.type === GameType.EyeFold && players.length >= 2) ||
      players.length >= 9
    ) {
      await gameQueue.add(
        "game-queue",
        {
          gameId: game!.id,
          action: "start",
        },
        {
          delay: 2000,
        },
      );
    }

    if (isAI) {
      io.to(gameId).emit("player:joined", player);
      quanbits.set(player.id, new Quanbit(game.type));
    }

    return player;
  },
  { connection: redis as ConnectionOptions },
);
