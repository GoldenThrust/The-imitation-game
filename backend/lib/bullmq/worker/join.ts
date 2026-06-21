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
    try {
      const { gameId, isAI, attachPlayerId } = job.data;

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

      console.log(
        `Processing join job for game ${gameId} with isAI=${isAI} and attachPlayerId=${attachPlayerId}`,
      );

      const humanPlayers = players.filter(
        (player) => player.role === Role.Human,
      );

      const AIPlayers = players.filter(
        (player) => player.role === Role.Quanbit,
      );

      console.log(`Human players in game ${gameId}: ${humanPlayers.length}`);

      console.log(
        `Player ${isAI ? "AI" : "Human"} joined game ${gameId}. Total players: ${players.length}, AI players: ${AIPlayers.length}`,
      );
      if (game.type === GameType.EyeFold && AIPlayers.length >= 2) {
        console.log(
          `Game ${gameId} is EyeFold and already has an AI player. Not allowing more AI players.`,
        );
        return;
      }

      if (players.length >= 10) {
        return;
      }

      const player = await prisma.player.create({
        data: {
          gameId: gameId,
          role: isAI ? Role.Quanbit : Role.Human,
        },
      });

      if (
        (game!.type === GameType.EyeFold && AIPlayers.length >= 1) ||
        players.length >= 9
      ) {
        await prisma.game.update({
          where: {
            id: game.id,
          },
          data: {
            active: false,
          },
        });
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
        console.log(`AI player ${player.id} joined game ${gameId}`);
        if (attachPlayerId) {
          quanbits.set(
            `${player.id}-${attachPlayerId}`,
            new Quanbit(game.type, `${player.id}-${attachPlayerId}`, game.id),
          );
          io.to(attachPlayerId).emit("player:joined", player);
        } else {
          quanbits.set(player.id, new Quanbit(game.type, player.id, game.id));
          io.to(gameId).emit("player:joined", player);
        }
      }

      return player;
    } catch (error) {
      console.error("Error processing join job:", error);
    }
  },
  { connection: redis as ConnectionOptions, concurrency: 5 },
);
