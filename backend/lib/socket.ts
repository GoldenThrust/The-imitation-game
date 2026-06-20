import { Server } from "socket.io";
import { server } from "../index.js";
import redis from "./redis";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import { prisma } from "./prisma.js";
import { quanbits } from "./AI/AI.js";
import { gameQueue } from "./bullmq/queue/game.js";
import { GameType, Role } from "../generated/prisma/enums.js";

export const io = new Server(server, {
  adapter: createAdapter(redis),
  cors: {
    origin: [`${process.env.CLIENT_URL}`],
    credentials: true,
  },
});

export const connectedPlayers = new Map();

function getActiveSocket(id: string) {
  return connectedPlayers.get(id);
}

io.on("connection", async (socket) => {
  try {
    const { roomId, playerId } = socket.handshake.query;

    // console.log(`Player ${playerId} connected to room ${roomId}`);

    socket.join(roomId as string);
    socket.join(playerId as string);

    connectedPlayers.set(playerId, socket.id);

    const player = await prisma.player.findUnique({
      where: {
        id: playerId as string,
      },
    });

    const game = await prisma.game.findUnique({
      where: {
        id: roomId as string,
      },
    });

    const players = await prisma.player.findMany({
      where: {
        gameId: game!.id,
        kicked: false,
      },
    });

    if (
      (game!.type === GameType.EyeFold && players.length >= 3) ||
      players.length >= 10
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

    socket.broadcast.to(roomId as string).emit("player:joined", player);

    socket.on("player:left", () => {
      socket.disconnect();
    });

    socket.on("message:send", async ({ from, to, text }) => {
      const targetSocket = connectedPlayers.get(to);
      const senderSocket = connectedPlayers.get(from);

      if (!senderSocket) {
        console.error(`Sender socket not found for player ${from}`);
        return;
      }

      console.log(
        `Message from ${from} to ${to}: ${text} (Room ID: ${roomId})`,
      );

      const chat = await prisma.chat.create({
        data: {
          text,
          playerId: from,
          toPlayerId: to,
          gameId: roomId as string,
        },
      });

      if (targetSocket) {
        socket.to(targetSocket).emit("message:receive", {
          id: chat.id,
          text: chat.text,
          from: to,
          to: from,
          createdAt: chat.createdAt,
        });
        return;
      }

      if (game!.type === GameType.EyeFold) {
        const quanbit = quanbits.get(to);

        if (!quanbit) return;

        await quanbit.addMessageToQueue({
          gameId: roomId as string,
          from,
          to,
          respondSocket: senderSocket,
          text,
          chatId: chat.id,
        });
      } else {
        const AIs = await prisma.player.findMany({
          where: {
            gameId: roomId as string,
            role: Role.Quanbit,
          },
        });

        for (const AI of AIs) {
          const quanbit = quanbits.get(AI.id);

          if (!quanbit) return;

          await quanbit.addMessageToQueue({
            gameId: roomId as string,
            from,
            to: AI.id,
            respondSocket: roomId as string,
            text,
            chatId: chat.id,
          });
        }
      }
    });

    socket.on("vote:cast", async ({ voterId, targetId }) => {
      const voterSocket = connectedPlayers.get(voterId);

      if (!voterSocket) {
        console.error(`Voter socket not found for player ${voterId}`);
        return;
      }

      const vote = await prisma.vote.create({
        data: {
          voterId,
          targetId,
          gameId: roomId as string,
        },
      });

      io.to(roomId as string).emit("vote:cast", {
        voterId: vote.voterId,
        targetId: vote.targetId,
      });

      const AIs = await prisma.player.findMany({
        where: {
          gameId: roomId as string,
          role: Role.Quanbit,
        },
      });

      for (const AI of AIs) {
        const quanbit = quanbits.get(AI.id);

        if (!quanbit || AI.id === voterId) return;

        await quanbit.addMessageToQueue({
          gameId: roomId as string,
          from: voterId,
          to: AI.id,
          respondSocket: roomId as string,
          text:
            AI.id === targetId
              ? `Player ${voterId} voted against you`
              : `Player ${voterId} voted against Player ${targetId}`,
          chatId: vote.id,
        });
      }

      const voteAgainstTarget = await prisma.vote.findMany({
        where: {
          targetId: targetId,
        },
      });

      const players = await prisma.player.findMany({
        where: {
          gameId: roomId as string,
          kicked: false,
        },
      });

      if (voteAgainstTarget.length >= Math.ceil(players.length / 2)) {
        connectedPlayers.delete(targetId);

        await prisma.player.update({
          where: {
            id: targetId,
          },
          data: {
            kicked: true,
          },
        });

        io.to(roomId as string).emit("player:kicked", {
          playerId: targetId,
        });
      }
    });

    socket.on("disconnect", async () => {
      // connectedPlayers.delete(playerId);

      try {
        setTimeout(async () => {
          const activeSocket = getActiveSocket(playerId as string);
          if (activeSocket) {
            return;
          }

          const player = await prisma.player.update({
            where: {
              id: playerId as string,
            },
            data: {
              kicked: true,
            },
          });

          io.to(roomId as string).emit("player:left", player);
        }, 2000);
      } catch (error) {
        console.error("Error updating player status on disconnect:", error);
      }
    });
  } catch (error) {
    console.error("Error handling WebSocket connection:", error);
  }
});
