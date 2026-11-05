import { createHash } from "node:crypto";

/**
 * The GUID RFC 6455 joins to the client's key.
 */
const WebsocketGuid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

/**
 * The `Sec-WebSocket-Accept` answer to a client's `Sec-WebSocket-Key`.
 */
export default function websocketAccept({ key }: { key: string }) {
    return createHash("sha1").update(key + WebsocketGuid).digest("base64");
}
