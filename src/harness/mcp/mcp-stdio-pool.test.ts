import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { McpServerRecord } from "@/src/types";

const started: Array<{ env: Record<string, string>; closed: boolean }> = [];
let nextPid = 1000;

mock.module("./start-stdio-mcp-client", () => ({
    default: async ({ env }: { env: Record<string, string> }) => {
        const record = { env, closed: false };
        started.push(record);
        const client = {
            onclose: null as (() => void) | null,
            close: async () => {
                record.closed = true;
            },
        };
        return { client, transport: { pid: nextPid++ } };
    },
}));

const { default: grabStdioMcpClient, stopStdioMcpServer } = await import("./mcp-stdio-pool");

const server = (over: Partial<McpServerRecord> = {}) =>
    ({
        id: 1,
        name: "s",
        command: "node server.js",
        setup_command: null,
        env: {},
        transport: "stdio",
        ...over,
    }) as McpServerRecord;

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
    started.length = 0;
});

afterEach(() => {
    stopStdioMcpServer({ server_id: 1 });
    stopStdioMcpServer({ server_id: 2 });
});

afterAll(() => {
    mock.restore();
});

describe("grabStdioMcpClient pool (M12)", () => {
    test("two runs with the same env share one client", async () => {
        const a = await grabStdioMcpClient({ server: server(), envs: [] });
        const b = await grabStdioMcpClient({ server: server(), envs: [] });

        expect(started.length).toBe(1);
        expect(a).toBe(b);
    });

    test("two runs with different envs keep separate clients, neither killed", async () => {
        const s = server({ env: { TOKEN: "{{env.T}}" } });
        const a = await grabStdioMcpClient({ server: s, envs: [{ key: "T", value: "alpha" }] });
        const b = await grabStdioMcpClient({ server: s, envs: [{ key: "T", value: "beta" }] });

        expect(started.length).toBe(2);
        expect(a).not.toBe(b);
        expect(started[0]!.closed).toBe(false);
        expect(started[1]!.closed).toBe(false);
    });

    test("stopping a server closes every environment's client", async () => {
        const s = server({ env: { TOKEN: "{{env.T}}" } });
        await grabStdioMcpClient({ server: s, envs: [{ key: "T", value: "alpha" }] });
        await grabStdioMcpClient({ server: s, envs: [{ key: "T", value: "beta" }] });

        stopStdioMcpServer({ server_id: 1 });
        await tick();

        expect(started.length).toBe(2);
        expect(started.every((r) => r.closed)).toBe(true);
    });

    test("a command change starts a new client", async () => {
        await grabStdioMcpClient({ server: server({ command: "node a.js" }), envs: [] });
        await grabStdioMcpClient({ server: server({ command: "node b.js" }), envs: [] });

        expect(started.length).toBe(2);
    });
});
