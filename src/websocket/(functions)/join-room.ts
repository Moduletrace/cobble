import { getMetadata, getAllRooms } from "../(data)/rooms";
import type { ServerWebSocket } from "bun";
import type { WebSocketSession } from "../types";
import type { WebsocketRoomType } from "@/src/types";

export function joinRoom(
    ws: ServerWebSocket<WebSocketSession>,
    room: WebsocketRoomType,
) {
    const meta = getMetadata(ws);
    const rooms = getAllRooms();
    meta.rooms.add(room);
    if (!rooms.has(room)) rooms.set(room, new Set());
    rooms.get(room)!.add(ws);
}