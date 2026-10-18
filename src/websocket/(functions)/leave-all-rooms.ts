import { getMetadata } from "../(data)/rooms";
import { leaveRoom } from "./leave-room";
import type { ServerWebSocket } from "bun";
import type { WebSocketSession } from "../types";

export function leaveAllRooms(ws: ServerWebSocket<WebSocketSession>) {
    const meta = getMetadata(ws);
    for (const room of meta.rooms) {
        leaveRoom(ws, room);
    }
}