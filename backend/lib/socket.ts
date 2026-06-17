import { Server } from "socket.io";
import { server } from "../index.js";
import redis from "./redis";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import { prisma } from "./prisma.js";
import { quanbits } from "./AI/AI.js";

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

    connectedPlayers.set(playerId, socket.id);

    const player = await prisma.player.findUnique({
      where: {
        id: playerId as string,
      },
    });

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
        senderSocket,
        text,
        chatId: chat.id,
      });
    });

    socket.on("disconnect", async () => {
      try {
        // await prisma.player.update({
        //   where: {
        //     id: playerId as string,
        //   },
        //   data: {
        //     kicked: true,
        //   },
        // });
      } catch (error) {
        console.error("Error updating player status on disconnect:", error);
      }
    });
  } catch (error) {
    console.error("Error handling WebSocket connection:", error);
  }
});
