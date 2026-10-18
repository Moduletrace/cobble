import type { WebSocketDataType } from "@/src/types";
import type { ServerWebSocket } from "bun";
import type { WebSocketSession } from "../types";

type Params = {
    ws: ServerWebSocket<WebSocketSession>;
    data: WebSocketDataType;
};

export function wsSendData({ data, ws }: Params) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    }
}