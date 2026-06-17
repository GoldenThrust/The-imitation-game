import { ConnectionOptions, Worker } from "bullmq";
import { shouldRespond } from "../../../utils";
import { quanbits } from "../../AI/AI";
import { prisma } from "../../prisma";
import { io } from "../../socket";
import redis from "../../redis";

export const aiWorker = new Worker(
  "respond",
  async (job) => {
    const { gameId, from, to, senderSocket, text } = job.data;

    const newText = `Player id: ${from} says: ${text}`;

    const decision = shouldRespond();


    if (decision === "ignore") {
      return;
    }

    const quanbit = quanbits.get(to);


    if (!quanbit) {
      return;
    }

    const aiText = await quanbit.sendMessageToAI(newText);


    const chat = await prisma.chat.create({
      data: {
        text: aiText,
        playerId: to,
        toPlayerId: from,
        gameId,
      },
    });

    io.to(senderSocket).emit("message:receive", {
      id: chat.id,
      text: chat.text,
      from: to,
      to: from,
      createdAt: chat.createdAt,
    });

    return chat;
  },
  {
    connection: redis as ConnectionOptions,
  },
);
