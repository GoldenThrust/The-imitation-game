import express from "express";
import { createServer } from "http";
import { prisma } from "./lib/prisma";
import { joinQueue } from "./lib/bullmq/queue/join";
import { initQueues } from "./lib/bullmq";
import { GameType, Role } from "./generated/prisma/enums";
import cors from "cors";
import { gameQueue } from "./lib/bullmq/queue/game";

const PORT = 3000;
const app = express();
export const server = createServer(app);

app.use(cors({ origin: `${process.env.CLIENT_URL}`, credentials: true }));

app.get("/", (_, res) => {
  res.send("Welcome to imitation game");
});

app.get("/room", async (req, res) => {
  try {
    const { type } = req.query;
    const gameType =
      type === "nightfall" ? GameType.NightFall : GameType.EyeFold;

    let game = await prisma.game.findFirst({
      where: {
        type: gameType,
        active: true,
      },
    });

    if (!game) {
      game = await prisma.game.create({
        data: {
          type: gameType,
          active: true,
          duration: gameType === GameType.NightFall ? 60 * 10 : 60 * 5, // 10 minutes for NightFall, 5 minutes for EyeFold
        },
      });

      await joinQueue.add("join", {
        gameId: game.id,
        isAI: true,
      });
    }

    const players = await prisma.player.findMany({
      where: {
        gameId: game.id,
        kicked: false,
      },
    });

    if (gameType === GameType.NightFall && players.length % 4 === 0) {
      await joinQueue.add("join", {
        gameId: game.id,
        isAI: true,
      });
    }

    if (
      (game.type === GameType.EyeFold && players.length >= 2) ||
      players.length >= 8
    ) {
      await prisma.game.update({
        where: {
          id: game.id,
        },
        data: {
          active: false,
        },
      });
    }

    if (
      players.length >= 10 ||
      (game.type === GameType.EyeFold && players.length >= 3)
    ) {
      return res.redirect(
        `${process.env.CLIENT_URL}?error=game is full. try again`,
      );
    }

    const player = await prisma.player.create({
      data: {
        gameId: game.id,
        role: Role.Human,
      },
    });

    if (gameType === "NightFall") {
      res.redirect(
        `${process.env.CLIENT_URL}/nightfall/${game.id}?id=${player.id}`,
      );
    } else {
      res.redirect(
        `${process.env.CLIENT_URL}/eyefold/${game.id}?id=${player.id}`,
      );
    }
  } catch (error) {
    res.redirect(
      `${process.env.CLIENT_URL}?error=error joining lobby. try again`,
    );
  }
});

app.get("/game-room/:id", async (req, res) => {
  const { id } = req.params;
  const { id: playerId } = req.query;

  try {
    const inRoom = await prisma.player.findUnique({
      where: {
        id: playerId as string,
        gameId: id,
      },
    });

    const game = await prisma.game.findUnique({
      where: {
        id: id,
      },
    });

    if (!inRoom || !game) throw new Error("Error finding game");

    const players = await prisma.player.findMany({
      where: {
        gameId: id,
        kicked: false,
      },
    });

    return res.json({
      message: "successful",
      players,
      game,
    });
  } catch (error) {
    return res.json({
      message: "Error finding game",
    });
  }
});

server.listen(PORT, () => {
  initQueues();
  console.log(`HTTP Server is running on port http://localhost:${PORT}`);
});
