import { getMetadata, getAllRooms } from "../(data)/rooms";
import type { ServerWebSocket } from "bun";
import type { WebSocketSession } from "../types";
import type { WebsocketRoomType } from "@/src/types";

export function leaveRoom(
    ws: ServerWebSocket<WebSocketSession>,
    room: WebsocketRoomType,
) {
    const meta = getMetadata(ws);
    const rooms = getAllRooms();
    meta.rooms.delete(room);
    rooms.get(room)?.delete(ws);
    if (rooms.get(room)?.size === 0) rooms.delete(room);
}