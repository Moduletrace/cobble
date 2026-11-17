import { afterAll, describe, expect, mock, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { McpServerRecord } from "@/src/types";

const dir = mkdtempSync(path.join(tmpdir(), "mcp-setup-"));

mock.module("./grab-mcp-dir", () => ({ default: async () => dir }));

const { default: runMcpSetup } = await import("./run-mcp-setup");

afterAll(() => {
    mock.restore();
    rmSync(dir, { recursive: true, force: true });
});

const secret = "supersecretvalue123";

function server(setup_command: string): McpServerRecord {
    return { id: 1, setup_command } as McpServerRecord;
}

describe("runMcpSetup redaction (L10)", () => {
    test("masks a secret the setup echoes into setup.log", async () => {
        await runMcpSetup({
            server: server(`printf '%s' "$TOKEN"`),
            env: { TOKEN: secret },
            force: true,
        });

        const log = readFileSync(path.join(dir, "setup.log"), "utf8");

        expect(log).toContain("[TOKEN]");
        expect(log).not.toContain(secret);
    });

    test("masks a secret in the failure it throws", async () => {
        const error = (await runMcpSetup({
            server: server(`printf '%s' "$TOKEN"; exit 1`),
            env: { TOKEN: secret },
            force: true,
        }).catch((e) => e)) as Error;

        expect(error.message).toContain("[TOKEN]");
        expect(error.message).not.toContain(secret);
    });
});