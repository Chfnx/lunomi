import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

type ClientMessage = { type: string; payload?: unknown };

const clients = new Set<WebSocket>();

export function setupWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    clients.add(ws);

    ws.on("close", () => {
      clients.delete(ws);
    });

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString()) as ClientMessage;
        if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch {
        // ignore malformed messages
      }
    });
  });

  return wss;
}

export function broadcast(event: string, data: unknown): void {
  const message = JSON.stringify({ type: event, data });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

export function getClientCount(): number {
  return clients.size;
}
