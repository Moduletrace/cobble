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
};

/**
 * Reads a browser's websocket frames (RFC 6455) from a byte stream fed in
 * any chunks: returns the function to feed them to, which calls `onFrame`
 * with each whole frame, unmasked. Throws on an unmasked or oversized
 * frame (a browser always masks).
 */
export default function readWebsocketFrames({ onFrame, max_payload }: Params) {
    let buffer: Buffer = Buffer.alloc(0);

    return (chunk: Buffer) => {
        buffer = buffer.length ? Buffer.concat([buffer, chunk]) : chunk;

        while (buffer.length >= 2) {
            const first = buffer[0]!;
            const second = buffer[1]!;
            let length = second & 0x7f;
            let offset = 2;

            if (!(second & 0x80)) throw new Error("A client frame came unmasked.");

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
            if (buffer.length < offset + 4 + length) return;

            const mask = buffer.subarray(offset, offset + 4);
            const payload = Buffer.from(buffer.subarray(offset + 4, offset + 4 + length));

            for (let index = 0; index < payload.length; index++) payload[index]! ^= mask[index & 3]!;

            buffer = buffer.subarray(offset + 4 + length);
            onFrame({ fin: Boolean(first & 0x80), opcode: first & 0x0f, payload });
        }
    };
}
