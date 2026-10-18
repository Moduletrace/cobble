import type { WebSocketDataType } from "@/src/types";
import { getAllRooms } from "../(data)/rooms";

type Params = {
    user_id: number | string;
    data: WebSocketDataType;
};

/**
 * Sends to every open socket of one user. Every socket joins `public` on
 * open, so its members are all connected clients.
 */
export function sendToUser({ user_id, data }: Params) {
    const members = getAllRooms().get("public");

    if (!members) return;

    const message = JSON.stringify(data);

    for (const ws of members) {
        if (
            String(ws.data.user?.id) == String(user_id) &&
            ws.readyState === WebSocket.OPEN
        ) {
            ws.send(message);
        }
    }
}
