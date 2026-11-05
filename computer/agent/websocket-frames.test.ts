import { describe, expect, test } from "bun:test";
import encodeWebsocketFrame from "./encode-websocket-frame";
import readWebsocketFrames, { type WebsocketFrame } from "./read-websocket-frames";

/**
 * A client frame as a browser sends it: masked.
 */
function clientFrame({ opcode, payload }: { opcode: number; payload: Buffer }) {
    const server = encodeWebsocketFrame({ opcode, payload });
    const header_length = server.length - payload.length;
    const mask = Buffer.from([1, 2, 3, 4]);
    const masked = Buffer.from(payload.map((byte, index) => byte ^ mask[index & 3]!));
    const header = Buffer.from(server.subarray(0, header_length));

    header[1]! |= 0x80;

    return Buffer.concat([header, mask, masked]);
}

function collect() {
    const frames: WebsocketFrame[] = [];
    const feed = readWebsocketFrames({ onFrame: (frame) => frames.push(frame), max_payload: 1 << 20 });

    return { frames, feed };
}

describe("websocket frames", () => {
    test("reads short, 16-bit and 64-bit lengths, unmasked", () => {
        const { frames, feed } = collect();

        for (const size of [5, 300, 70_000]) feed(clientFrame({ opcode: 2, payload: Buffer.alloc(size, size % 251) }));

        expect(frames.map((frame) => frame.payload.length)).toEqual([5, 300, 70_000]);
        expect(frames.every((frame) => frame.fin && frame.opcode == 2)).toBe(true);
        expect(frames[1]!.payload.every((byte) => byte == 300 % 251)).toBe(true);
    });

    test("waits for a frame split across chunks, and reads two in one chunk", () => {
        const { frames, feed } = collect();
        const one = clientFrame({ opcode: 2, payload: Buffer.from("hello") });
        const two = clientFrame({ opcode: 9, payload: Buffer.from("ping") });
        const both = Buffer.concat([one, two]);

        for (let index = 0; index < both.length; index += 3) feed(both.subarray(index, index + 3));

        expect(frames.map((frame) => [frame.opcode, frame.payload.toString()])).toEqual([
            [2, "hello"],
            [9, "ping"],
        ]);
    });

    test("refuses unmasked and oversized frames", () => {
        const { feed } = collect();

        expect(() => feed(encodeWebsocketFrame({ opcode: 2, payload: Buffer.from("x") }))).toThrow("unmasked");
        expect(() => collect().feed(clientFrame({ opcode: 2, payload: Buffer.alloc((1 << 20) + 1) }))).toThrow("too large");
    });
});
