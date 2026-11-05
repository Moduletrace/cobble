import { describe, expect, test } from "bun:test";
import encodeWebsocketFrame from "./encode-websocket-frame";
import readWebsocketFrames, { type WebsocketFrame } from "./read-websocket-frames";

/**
 * A client frame as a browser sends it: masked.
 */
function clientFrame({ opcode, payload }: { opcode: number; payload: Buffer }) {
    return encodeWebsocketFrame({ opcode, payload, mask: Buffer.from([1, 2, 3, 4]) });
}

function collect({ from }: { from?: "client" | "server" } = {}) {
    const frames: WebsocketFrame[] = [];
    const feed = readWebsocketFrames({ onFrame: (frame) => frames.push(frame), max_payload: 1 << 20, from });

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

    test("masks a client's frame as RFC 6455 says", () => {
        const frame = clientFrame({ opcode: 1, payload: Buffer.from("abcd") });

        expect([...frame]).toEqual([0x81, 0x84, 1, 2, 3, 4, 0x61 ^ 1, 0x62 ^ 2, 0x63 ^ 3, 0x64 ^ 4]);
    });

    test("reads a server's unmasked frames, and refuses masked ones from it", () => {
        const { frames, feed } = collect({ from: "server" });

        for (const size of [3, 300, 70_000]) feed(encodeWebsocketFrame({ opcode: 1, payload: Buffer.alloc(size, 7) }));

        expect(frames.map((frame) => frame.payload.length)).toEqual([3, 300, 70_000]);
        expect(() => collect({ from: "server" }).feed(clientFrame({ opcode: 1, payload: Buffer.from("x") }))).toThrow("masked");
    });
});
