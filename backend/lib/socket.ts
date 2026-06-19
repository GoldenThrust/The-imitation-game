import { Server } from "socket.io";
import { server } from "../index.js";
import redis from "./redis";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import { prisma } from "./prisma.js";
import { quanbits } from "./AI/AI.js";
import { gameQueue } from "./bullmq/queue/game.js";
import { GameType } from "../generated/prisma/enums.js";

export const io = new Server(server, {
  adapter: createAdapter(redis),
  cors: {
    origin: [`${process.env.CLIENT_URL}`],
    credentials: true,
  },
});

const connectedPlayers = new Map();

io.on("connection", async (socket) => {
  try {
    const { roomId, playerId } = socket.handshake.query;

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
    });

    socket.on("disconnect", async () => {
      // connectedPlayers.delete(playerId);
  
      try {
        // setTimeout(async () => {
        //   const activeSocket = connectedPlayers.get(playerId);
        //   if (activeSocket) {
        //     return;
        //   }
        //   const player = await prisma.player.update({
        //     where: {
        //       id: playerId as string,
        //     },
        //     data: {
        //       kicked: true,
        //     },
        //   });
        //   io.to(roomId as string).emit("player:joined", player);
        // }, 2000);
      } catch (error) {
        console.error("Error updating player status on disconnect:", error);
      }
    });
  } catch (error) {
    console.error("Error handling WebSocket connection:", error);
  }
});
