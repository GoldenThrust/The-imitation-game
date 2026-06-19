import { FunctionCallingConfigMode, GoogleGenAI } from "@google/genai";
import { systemsInstruction } from "./systemsInstruction";
import { aiQueue } from "../bullmq/queue/ai";
import { responseDelay } from "../../utils";
import { GameType } from "../../generated/prisma/enums";
import { eyefoldTools, nightfallTools } from "./gemini/tools";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});
export type QuanbitAction =
  | { type: "message"; message: string; targetPlayerId?: string; typingDelayMs?: number }
  | { type: "vote"; targetPlayerId: string; publicReason: string };

export default class Quanbit {
  chat: any;
  private gameType: GameType;

  constructor(type: GameType) {
    this.gameType = type;

    const tools = type === GameType.NightFall ? nightfallTools : eyefoldTools;

    this.chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction:
          type === GameType.NightFall
            ? systemsInstruction.NightFall
            : systemsInstruction.EyeFold,
        temperature: 0.9,
        tools: [{ functionDeclarations: tools }],
        // force a tool call every turn so we never get unstructured prose
        // we'd have to fall back on
        toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.ANY } },
      },
    });
  }

  async addMessageToQueue(data: {
    gameId: string;
    from: string;
    to: string;
    text: string;
    chatId: string;
    respondSocket: string;
  }) {
    await aiQueue.add("respond", data, {
      delay: responseDelay(data.text),
      attempts: 3,
    });

    console.log(
      `Added job to queue for game ${data.gameId}: ${data.from} -> ${data.to}: ${data.text}`
    );
  }

  /**
   * Sends a message into the chat's own managed history (the SDK keeps
   * the running conversation internally — we never need to replay turns
   * ourselves) and returns a list of parsed actions instead of raw text.
   */
  async sendMessageToAI(text: string): Promise<QuanbitAction[]> {
    console.log(`Sending message to AI: ${text}`);

    const response = await this.chat.sendMessage({
      message: text,
    });

    console.log(response);

    const actions = this.parseFunctionCalls(response);

    console.log(
      `Parsed ${actions.length} action(s) from AI response:`,
      JSON.stringify(actions)
    );

    return actions;
  }

  private parseFunctionCalls(response: any): QuanbitAction[] {
    const calls = response.functionCalls ?? [];

    if (calls.length === 0) {
      console.warn(
        "Gemini returned no function calls (likely plain text). Treating as no action.",
        response.text
      );
      return [];
    }

    const actions: QuanbitAction[] = [];

    for (const call of calls) {
      switch (call.name) {
        case "respondToMessage": {
          const { message, targetPlayerId, typingDelayMs } = call.args ?? {};
          if (!message || typeof message !== "string") {
            console.warn("Malformed respondToMessage args, skipping:", call.args);
            break;
          }
          actions.push({ type: "message", message, targetPlayerId, typingDelayMs });
          break;
        }

        case "voteAgainst": {
          if (this.gameType !== GameType.NightFall) {
            console.warn("voteAgainst called outside NightFall, ignoring.");
            break;
          }
          const { targetPlayerId, publicReason } = call.args ?? {};
          if (!targetPlayerId) {
            console.warn("Malformed voteAgainst args, skipping:", call.args);
            break;
          }
          actions.push({
            type: "vote",
            targetPlayerId,
            publicReason: publicReason ?? "",
          });
          break;
        }

        default:
          console.warn("Unrecognized function call from model:", call.name);
      }
    }

    return actions;
  }
}

export const quanbits = new Map<string, Quanbit>();