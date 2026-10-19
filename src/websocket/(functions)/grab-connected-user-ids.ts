import { getAllRooms } from "../(data)/rooms";

/**
 * The users with an open socket on this process (every socket joins
 * `public` on open).
 */
export default function grabConnectedUserIds() {
    const ids = new Set<string>();

    for (const ws of getAllRooms().get("public") || []) {
        if (ws.data.user?.id && ws.readyState === WebSocket.OPEN) {
            ids.add(String(ws.data.user.id));
        }
    }

    return ids;
}
