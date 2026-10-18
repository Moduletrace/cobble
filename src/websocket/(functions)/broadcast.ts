import type { WebSocketDataType, WebsocketRoomType } from "@/src/types";
import { getAllRooms } from "../(data)/rooms";
import type { ServerWebSocket } from "bun";
import type { WebSocketSession } from "../types";

export function broadcast(
    room: WebsocketRoomType,
    data: WebSocketDataType,
    exclude?: ServerWebSocket<WebSocketSession>,
) {
    const rooms = getAllRooms();
    const members = rooms.get(room);

    if (!members) return;

    const message = JSON.stringify(data);

    for (const ws of members) {
        if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
            ws.send(message);
        }
    }
}