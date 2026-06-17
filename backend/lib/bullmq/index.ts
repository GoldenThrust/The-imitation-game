export function initQueues() {
    import("./worker/ai");
    import("./worker/chat");
    import("./worker/game");
    import("./worker/join");
  console.log("Queues initialized");
}