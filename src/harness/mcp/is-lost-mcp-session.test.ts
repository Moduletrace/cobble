import { describe, expect, test } from "bun:test";
import isLostMcpSession from "./is-lost-mcp-session";

describe("isLostMcpSession", () => {
    test("matches the errors a restarted server gives", () => {
        expect(
            isLostMcpSession({
                text: "Error: Streamable HTTP error: Error POSTing to endpoint: Session not found",
            }),
        ).toBe(true);
        expect(isLostMcpSession({ text: "Error: fetch failed" })).toBe(true);
        expect(isLostMcpSession({ text: "Error: Connection refused (ECONNREFUSED)" })).toBe(true);
        expect(isLostMcpSession({ text: "MCP error -32000: Connection closed" })).toBe(true);
    });

    test("leaves a tool's own error alone", () => {
        expect(isLostMcpSession({ text: "Error: Element not found: ref=e12" })).toBe(false);
        expect(isLostMcpSession({ text: "Error: Wrong arguments for browser_click." })).toBe(false);
    });
});
