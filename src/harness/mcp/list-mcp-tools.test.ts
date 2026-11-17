import { describe, expect, test } from "bun:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { AppData } from "@/src/data/app-data";
import listMcpTools from "./list-mcp-tools";

const tool = (name: string) => ({ name, description: name, inputSchema: { type: "object" } });

/**
 * A server whose pages are scripted; counts how many times it was asked.
 */
function client(pages: Array<{ tools: ReturnType<typeof tool>[]; nextCursor?: string }>) {
    let calls = 0;
    const stub = {
        listTools: async () => {
            const page = pages[Math.min(calls, pages.length - 1)]!;
            calls += 1;
            return page;
        },
    };
    return { stub: stub as unknown as Client, calls: () => calls };
}

describe("listMcpTools pagination bounds (M11)", () => {
    test("collects every tool across pages", async () => {
        const { stub } = client([
            { tools: [tool("a")], nextCursor: "c1" },
            { tools: [tool("b")], nextCursor: "c2" },
            { tools: [tool("c")] },
        ]);

        const tools = await listMcpTools({ client: stub });

        expect(tools.map((t) => t.name)).toEqual(["a", "b", "c"]);
    });

    test("a server repeating its cursor stops, not loops", async () => {
        const { stub, calls } = client([
            { tools: [tool("a")], nextCursor: "same" },
            { tools: [tool("b")], nextCursor: "same" },
        ]);

        const tools = await listMcpTools({ client: stub });

        expect(tools.map((t) => t.name)).toEqual(["a", "b"]);
        expect(calls()).toBe(2);
    });

    test("an endless cursor is cut at the page cap", async () => {
        let n = 0;
        const stub = {
            listTools: async () => {
                n += 1;
                return { tools: [tool(`t${n}`)], nextCursor: `c${n}` };
            },
        } as unknown as Client;

        const tools = await listMcpTools({ client: stub });

        expect(tools.length).toBe(AppData.McpToolListMaxPages);
        expect(n).toBe(AppData.McpToolListMaxPages);
    });

    test("a huge page is cut at the tool cap", async () => {
        const many = Array.from({ length: AppData.McpToolListMaxTools + 100 }, (_, i) => tool(`t${i}`));
        const { stub } = client([{ tools: many, nextCursor: "more" }]);

        const tools = await listMcpTools({ client: stub });

        expect(tools.length).toBe(AppData.McpToolListMaxTools);
    });
});
