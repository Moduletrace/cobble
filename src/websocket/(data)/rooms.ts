import type { ServerWebSocket } from "bun";
import type { WebSocketSession } from "../types";
import type { WebsocketRoomType } from "@/src/types";

export type ClientMetadata = {
    user_id?: string | number;
    rooms: Set<WebsocketRoomType>;
    joinedAt: number;
};

const clients = new WeakMap<
    ServerWebSocket<WebSocketSession>,
    ClientMetadata
>();
const rooms = new Map<
    WebsocketRoomType,
    Set<ServerWebSocket<WebSocketSession>>
>();

export function getMetadata(
    ws: ServerWebSocket<WebSocketSession>,
): ClientMetadata {
    let meta = clients.get(ws);
    if (!meta) {
        meta = { rooms: new Set(), joinedAt: Date.now() };
        clients.set(ws, meta);
    }
    return meta;
}

export function getAllClients() {
    return clients;
}

export function getAllRooms() {
    return rooms;
}