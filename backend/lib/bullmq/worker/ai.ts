import { ConnectionOptions, Worker } from "bullmq";
import { shouldRespond } from "../../../utils";
import { quanbits } from "../../AI/AI";
import { prisma } from "../../prisma";
import { io } from "../../socket";
import redis from "../../redis";

export const aiWorker = new Worker(
  "respond",
  async (job) => {
    const { gameId, from, to, respondSocket, text } = job.data;

    const newText = `Player ${from}: ${text}`;


    const quanbit = quanbits.get(to);

    console.log(
      `Retrieved Quanbit for game ${gameId}: ${quanbit ? "found" : "not found"} for message from ${from} to ${to}: ${text}`
    );

    if (!quanbit) {
      return;
    }

    const actions = await quanbit.sendMessageToAI(newText);

    console.log(
      `AI actions for game ${gameId}:`,
      JSON.stringify(actions),
      `for message from ${from} to ${to}: ${text}`
    );

    const createdChats = [];

    for (const action of actions) {
      if (action.type === "message") {
        const chat = await prisma.chat.create({
          data: {
            text: action.message,
            playerId: to,
            toPlayerId: action.targetPlayerId ?? from,
            gameId,
          },
        });

        if (action.typingDelayMs && action.typingDelayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, action.typingDelayMs));
        }
        
        io.to(respondSocket).emit("message:receive", {
          id: chat.id,
          text: chat.text,
          from: to,
          to: action.targetPlayerId ?? from,
          createdAt: chat.createdAt,
        });

        createdChats.push(chat);
      }

      if (action.type === "vote") {
        // adjust to your actual vote persistence model/table
        // await prisma.vote.create({
        //   data: {
        //     gameId,
        //     voterId: to,
        //     targetId: action.targetPlayerId,
        //     reason: action.publicReason,
        //   },
        // });

        io.to(respondSocket).emit("vote:cast", {
          voterId: to,
          targetId: action.targetPlayerId,
        });
      }
    }

    return createdChats;
  },
  {
    connection: redis as ConnectionOptions,
  }
);