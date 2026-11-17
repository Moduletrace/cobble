import { describe, expect, test } from "bun:test";
import type { SaveMcpServerRequest } from "@/src/schemas/extension-schema";
import saveMcpServer from "./save-mcp-server";

/**
 * The host guard runs before any database write, so a refused URL needs no
 * mocks. `mcp-url-host.test.ts` covers the rule itself; this pins that
 * `saveMcpServer` enforces it on the way in (H6).
 */
const remote = (url: string) =>
    ({
        transport: "remote",
        url,
        name: "X",
        description: "",
        headers: {},
        command: "",
        setup_command: "",
        env: {},
        excluded_tools: [],
        enabled: true,
        all_bots: false,
    }) as unknown as SaveMcpServerRequest;

describe("saveMcpServer refuses a templated host (H6)", () => {
    test("an env template in the host is refused before anything is saved", async () => {
        await expect(saveMcpServer({ user_id: 1, data: remote("https://{{env.HOST}}/mcp") })).rejects.toThrow(
            "fixed host",
        );
    });

    test("an args template in the host is refused too", async () => {
        await expect(saveMcpServer({ user_id: 1, data: remote("https://{{args.host}}/mcp") })).rejects.toThrow(
            "fixed host",
        );
    });
});
