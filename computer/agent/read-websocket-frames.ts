export type WebsocketFrame = {
    fin: boolean;
    opcode: number;
    payload: Buffer;
};

type Params = {
    onFrame: (frame: WebsocketFrame) => void;
    /**
     * A frame claiming more than this ends the connection.
     */
    max_payload: number;
    /**
     * Who sends the frames: a client (a browser, the default) always
     * masks them, a server (Chrome's DevTools, to the agent's own client)
     * never does.
     */
    from?: "client" | "server";
};

/**
 * Reads websocket frames (RFC 6455) from a byte stream fed in any chunks:
 * returns the function to feed them to, which calls `onFrame` with each
 * whole frame, unmasked. Throws on a frame masked the wrong way for its
 * sender, or an oversized one.
 */
export default function readWebsocketFrames({ onFrame, max_payload, from = "client" }: Params) {
    let buffer: Buffer = Buffer.alloc(0);

    return (chunk: Buffer) => {
        buffer = buffer.length ? Buffer.concat([buffer, chunk]) : chunk;

        while (buffer.length >= 2) {
            const first = buffer[0]!;
            const second = buffer[1]!;
            const masked = Boolean(second & 0x80);
            let length = second & 0x7f;
            let offset = 2;

            if (from == "client" && !masked) throw new Error("A client frame came unmasked.");
            if (from == "server" && masked) throw new Error("A server frame came masked.");

            if (length == 126) {
                if (buffer.length < 4) return;
                length = buffer.readUInt16BE(2);
                offset = 4;
            } else if (length == 127) {
                if (buffer.length < 10) return;
                const long = buffer.readBigUInt64BE(2);
                if (long > BigInt(max_payload)) throw new Error("A frame was too large.");
                length = Number(long);
                offset = 10;
            }

            if (length > max_payload) throw new Error("A frame was too large.");

            const mask_length = masked ? 4 : 0;

            if (buffer.length < offset + mask_length + length) return;

            const payload = Buffer.from(buffer.subarray(offset + mask_length, offset + mask_length + length));

            if (masked) {
                const mask = buffer.subarray(offset, offset + 4);

                for (let index = 0; index < payload.length; index++) payload[index]! ^= mask[index & 3]!;
            }

            buffer = buffer.subarray(offset + mask_length + length);
            onFrame({ fin: Boolean(first & 0x80), opcode: first & 0x0f, payload });
        }
    };
}
