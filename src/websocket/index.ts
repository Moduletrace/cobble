import type { ServerWebSocket } from "bun";
import type { WebSocketSession } from "./types";
import { joinRoom } from "./(functions)/join-room";
import { leaveRoom } from "./(functions)/leave-room";
import { leaveAllRooms } from "./(functions)/leave-all-rooms";
import { broadcast } from "./(functions)/broadcast";
import { handleMessage } from "./(functions)/handle-message";
import { getAllClients, getAllRooms } from "./(data)/rooms";
import type { WebSocketDataType } from "@/src/types";
import { wsSendData } from "./(functions)/ws-send-data";
import checkSessionAccess from "./(functions)/check-session-access";
import logEvent from "@/src/functions/backend/logger";
import { computerProxySocket } from "@/src/functions/server/computers/computer-proxy-socket";
import touchUserPresence from "@/src/functions/backend/db/push/touch-user-presence";

/**
 * The twui `useWebSocket` hook sends a raw keepalive string to keep the
 * connection alive. Non-JSON messages are safe to ignore.
 */
function parseMessage(message: string | Buffer): WebSocketDataType | undefined {
    const text = message.toString();

    try {
        return JSON.parse(text) as WebSocketDataType | undefined;
    } catch (error) {
        return undefined;
    }
}

export const websocket = {
    open(ws: ServerWebSocket<WebSocketSession>) {
        if (ws.data.proxy) return computerProxySocket.open(ws);

        const { user } = ws.data;

        joinRoom(ws, "public");

        if (user.id) {
            void touchUserPresence({ user_id: user.id }).catch(() => {});
        }

        wsSendData({
            ws,
            data: {
                event: "ready",
                message: "WebSocket connected",
            },
        });

        logEvent({
            title: "WebSocket connected",
            category: "websocket",
            user_id: user.id,
            plain_text: `User #${user.id} [${user.first_name} ${user.last_name}] connected via WebSocket.`,
            metadata: {
                user_id: user.id,
            },
        });
    },

    async message(
        ws: ServerWebSocket<WebSocketSession>,
        message: string | Buffer,
    ) {
        if (ws.data.proxy) return computerProxySocket.message(ws, message);

        /**
         * Every keepalive counts, including twui's raw ping string, so
         * presence stays fresh while the app is open.
         */
        if (ws.data.user?.id) {
            void touchUserPresence({ user_id: ws.data.user.id }).catch(() => {});
        }

        const data = parseMessage(message);

        if (!data) return;

        const access = await checkSessionAccess({ session: ws.data });

        if (!access.allowed) {
            ws.close(4401, "Unauthorized");
            return;
        }

        if (access.user_types) {
            ws.data.user_types = access.user_types;
        }

        handleMessage(ws, data);
    },

    close(ws: ServerWebSocket<WebSocketSession>) {
        if (ws.data.proxy) return computerProxySocket.close(ws);

        leaveAllRooms(ws);
    },

    drain(ws: ServerWebSocket<WebSocketSession>) {},
    broadcast,
    joinRoom,
    leaveRoom,
    getClients: getAllClients,
    getRooms: getAllRooms,
};