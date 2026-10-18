import { describe, expect, test } from "bun:test";
import composeBotPrompt from "./compose-bot-prompt";

describe("composeBotPrompt", () => {
    test("orders core instructions, workspaces, then memory", () => {
        expect(
            composeBotPrompt({
                system_prompt: "# You are Scout\n\nFind things.",
                memory: "- The user prefers short replies.",
                workspaces: [
                    { name: "Launch", system_prompt: "Ship by Friday." },
                    { name: "Ops", system_prompt: "Servers are on Debian." },
                ],
            }),
        ).toBe(
            [
                "# You are Scout\n\nFind things.",
                "# Workspace: Launch\n\nShip by Friday.",
                "# Workspace: Ops\n\nServers are on Debian.",
                "# Memory\n\n- The user prefers short replies.",
            ].join("\n\n"),
        );
    });

    test("leaves out empty parts", () => {
        expect(
            composeBotPrompt({
                system_prompt: "Core.",
                memory: "   ",
                workspaces: [
                    { name: "Empty", system_prompt: "" },
                    { name: null, system_prompt: "Shared." },
                ],
            }),
        ).toBe("Core.\n\n# Workspace: Untitled\n\nShared.");
        expect(composeBotPrompt({})).toBe("");
    });
});
