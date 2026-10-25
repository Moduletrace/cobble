import { describe, expect, test } from "bun:test";
import describeToolUses from "./describe-tool-uses";

describe("describeToolUses", () => {
    test("says none when no tool ran", () => {
        expect(describeToolUses({ uses: [] })).toBe("none");
    });

    test("groups calls by tool, in the order first called, and marks failures", () => {
        expect(
            describeToolUses({
                uses: [
                    { name: "fetch_url", ok: true },
                    { name: "update_memory", ok: true },
                    { name: "fetch_url", ok: false },
                    { name: "fetch_url", ok: true },
                    { name: "set_bot_workspace_instructions", ok: false },
                ],
            }),
        ).toBe("fetch_url x3 (1 failed), update_memory, set_bot_workspace_instructions (failed)");
    });
});
