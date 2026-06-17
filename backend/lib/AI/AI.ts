import { GoogleGenAI } from "@google/genai";
import { systemsInstruction } from "./systemsInstruction";
import { aiQueue } from "../bullmq/queue/ai";
import { responseDelay } from "../../utils";
import { GameType } from "../../generated/prisma/enums";

export default class Quanbit {
  chat: any;

  constructor(type: GameType) {
    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY!,
    });

    this.chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction:
          type === GameType.NightFall
            ? systemsInstruction.NightFall
            : systemsInstruction.EyeFold,
        temperature: 0.9,
      },
    });
  }

  async addMessageToQueue(data: {
    gameId: string;
    from: string;
    to: string;
    text: string;
    chatId: string;
    senderSocket: string;
  }) {
    await aiQueue.add(
      "respond",
      data,
      {
        delay: responseDelay(data.text),
        attempts: 3,
      }
    );

    console.log(`Added job to queue for game ${data.gameId}: ${data.from} -> ${data.to}: ${data.text}`);
  }

  async sendMessageToAI(text: string) {
    const response = await this.chat.sendMessage({
      message: text,
    });

    return response.text;
  }
}

export const quanbits = new Map<string, Quanbit>();