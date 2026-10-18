import type { WebSocketDataType } from "@/src/types";
import type { ServerWebSocket } from "bun";
import type { WebSocketSession } from "../../types";
import { wsSendData } from "../../(functions)/ws-send-data";

type Params = {
    data: WebSocketDataType;
    ws: ServerWebSocket<WebSocketSession>;
};

export default function wsPing({ ws }: Params) {
    if (ws.readyState === WebSocket.OPEN) {
        wsSendData({
            ws,
            data: {
                event: "server:pong",
            },
        });
    }
}