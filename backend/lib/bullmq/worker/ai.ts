import { ConnectionOptions, Worker } from "bullmq";
import { shouldRespond } from "../../../utils";
import { quanbits } from "../../AI/AI";
import { prisma } from "../../prisma";
import { connectedPlayers, io } from "../../socket";
import redis from "../../redis";
import { Role } from "../../../generated/prisma/browser";
import { voteQueue } from "../queue/vote";

export const aiWorker = new Worker(
  "respond",
  async (job) => {
    const { gameId, from, to, respondSocket, text, myId } = job.data;

    const newText = `Player ${from}: ${text}`;

    const quanbit = quanbits.get(to);

    // console.log(
    //   `Retrieved Quanbit for game ${gameId}: ${quanbit ? "found" : "not found"} for message from ${from} to ${to}: ${text}`,
    // );

    if (!quanbit) {
      return;
    }

    const actions = await quanbit.sendMessageToAI(newText);

    console.log(
      `AI actions for game ${gameId}:`,
      JSON.stringify(actions),
      `for message from ${from} to ${to}: ${text}`,
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
          await new Promise((resolve) =>
            setTimeout(async () => {
              io.to(respondSocket).emit("message:receive", {
                id: chat.id,
                text: chat.text,
                from: to,
                to: action.targetPlayerId ?? from,
                createdAt: chat.createdAt,
              });

              const AIs = await prisma.player.findMany({
                where: {
                  gameId: gameId as string,
                  role: Role.Quanbit,
                },
              });

              for (const AI of AIs) {
                const quanbit = quanbits.get(AI.id);

                if (!quanbit || AI.id === myId) return;

                await quanbit.addMessageToQueue({
                  gameId: gameId as string,
                  from,
                  to: AI.id,
                  respondSocket: gameId as string,
                  text,
                  chatId: chat.id,
                });
              }

              resolve(true);
            }, action.typingDelayMs),
          );
        }

        createdChats.push(chat);
      }

      if (action.type === "vote") {
        await voteQueue.add("vote-queue", {
          gameId,
          voterId: myId,
          targetId: action.targetPlayerId,
          reason: action.publicReason,
        });
      }
    }

    return createdChats;
  },
  {
    connection: redis as ConnectionOptions,
  },
);
