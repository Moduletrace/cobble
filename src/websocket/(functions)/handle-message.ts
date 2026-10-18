import type { WebSocketDataType } from "@/src/types";
import type { ServerWebSocket } from "bun";
import type { WebSocketSession } from "../types";
import { wsSendData } from "./ws-send-data";
import wsPing from "../client-requests/ping";
import { logError } from "@/src/functions/backend/logger";

export function handleMessage(
    ws: ServerWebSocket<WebSocketSession>,
    data?: WebSocketDataType,
) {
    const { user } = ws.data;

    try {
        if (!data?.event) {
            return wsSendData({
                ws,
                data: {
                    event: "error",
                    error: `No Data Provided`,
                },
            });
        }

        const { event } = data;

        if (event === "client:ping") {
            return wsPing({ data, ws });
        }

        if (event === "ready" || event === "message") {
            wsSendData({
                ws,
                data: { event: "success", message: "connected" },
            });
            return;
        }

        wsSendData({
            ws,
            data: {
                event: "error",
                error: `Unknown event: ${event}`,
            },
        });
    } catch (error: any) {
        logError({
            title: "WebSocket message error",
            category: "websocket",
            user_id: user.id,
            error,
            metadata: {
                event: data?.event,
            },
        });

        wsSendData({
            ws,
            data: {
                event: "error",
                error: `ERROR: ${error.message}`,
            },
        });
    }
}