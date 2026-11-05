import { expect, test } from "bun:test";
import websocketAccept from "./websocket-accept";

test("answers the RFC 6455 example key", () => {
    expect(websocketAccept({ key: "dGhlIHNhbXBsZSBub25jZQ==" })).toBe("s3pPLMBiTxaQ9kYGzzhZRbK+xOo=");
});
