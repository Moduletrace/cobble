import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import toolTimeoutMs from "./tool-timeout-ms";
import type { HarnessTool } from "../types";

function tool({ timeout_ms }: { timeout_ms?: number | null }): HarnessTool {
    return {
        name: "computer_bash",
        description: "test",
        ...(timeout_ms === undefined ? {} : { timeout_ms }),
        run: async () => "done",
    };
}

describe("toolTimeoutMs", () => {
    test("a tool with no opinion gets the install's cap", () => {
        expect(toolTimeoutMs({ tool: tool({}) })).toBe(AppData.HarnessToolTimeoutMs);
    });

    test("a tool may ask for a larger deadline of its own", () => {
        expect(toolTimeoutMs({ tool: tool({ timeout_ms: 3_600_000 }) })).toBe(3_600_000);
    });

    test("a tool may ask for no deadline at all", () => {
        expect(toolTimeoutMs({ tool: tool({ timeout_ms: null }) })).toBeNull();
    });
});