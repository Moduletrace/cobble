import { describe, expect, test } from "bun:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import mcpHarnessTool from "./mcp-harness-tool";

const tool = { name: "browser_snapshot", description: "Looks at the page.", input_schema: {} };
const lost = "Streamable HTTP error: Error POSTing to endpoint: Session not found";

function fakeClient({ fail }: { fail: () => string | null }) {
    const client = {
        calls: 0,
        async callTool() {
            client.calls++;

            const error = fail();
            if (error) throw new Error(error);

            return { content: [{ type: "text", text: "The page." }] };
        },
    };

    return client;
}

describe("mcpHarnessTool", () => {
    test("reconnects once and makes the call again when the session is gone", async () => {
        const broken = fakeClient({ fail: () => lost });
        const fresh = fakeClient({ fail: () => null });
        let current = broken as unknown as Client;
        let reconnects = 0;

        const call = mcpHarnessTool({
            tool,
            client: async () => current,
            reconnect: async () => {
                reconnects++;
                current = fresh as unknown as Client;
            },
        });

        expect(await call.run({ args: {}, signal: new AbortController().signal })).toBe("The page.");
        expect(reconnects).toBe(1);
        expect(broken.calls).toBe(1);
        expect(fresh.calls).toBe(1);
    });

    test("a tool's own error is passed on without reconnecting", async () => {
        const broken = fakeClient({ fail: () => "Element not found: ref=e12" });
        let reconnects = 0;

        const call = mcpHarnessTool({
            tool,
            client: broken as unknown as Client,
            reconnect: async () => {
                reconnects++;
            },
        });

        await expect(call.run({ args: {}, signal: new AbortController().signal })).rejects.toThrow("Element not found");
        expect(reconnects).toBe(0);
        expect(broken.calls).toBe(1);
    });

    test("a bridge that is really down fails after one retry", async () => {
        const broken = fakeClient({ fail: () => lost });
        let reconnects = 0;

        const call = mcpHarnessTool({
            tool,
            client: broken as unknown as Client,
            reconnect: async () => {
                reconnects++;
            },
        });

        await expect(call.run({ args: {}, signal: new AbortController().signal })).rejects.toThrow("Session not found");
        expect(reconnects).toBe(1);
        expect(broken.calls).toBe(2);
    });
});
