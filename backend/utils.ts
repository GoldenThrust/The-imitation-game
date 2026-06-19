export function calculateHumanDelay(messageText: string) {
  const words = messageText.split(/\s+/).length;
  
  const readTimeMs = (words / 230) * 60 * 1000;
  const thinkTimeMs = Math.random() * 1500 + 500;
  const physicalTypingTimeMs = Math.random() * 1000 + 800; 

  const totalDelay = readTimeMs + thinkTimeMs + physicalTypingTimeMs;
  
  return Math.max(2000, Math.min(totalDelay, 6500));
}
// src/queues/utils/sleep.ts
export const sleep = (ms: number) =>
  new Promise((res) => setTimeout(res, ms));

// src/queues/utils/humanization.ts
export function shouldRespond() {
  const rand = Math.random();

  if (rand < 0.20) return "ignore";
  if (rand < 0.35) return "short";
  if (rand < 0.90) return "normal";

  return "change-topic";
}

export function responseDelay(message: string) {
  const words = message.split(" ").length;

  const readingTime = words * 100;

  return (
    readingTime +
    Math.floor(Math.random() * 5000)
  );
}

export function humanJoinDelay() {
  const base = 2000;
  const thinking = Math.random() * 8000;
  const distraction = Math.random() < 0.3 ? Math.random() * 12000 : 0;

  return base + thinking + distraction;
}