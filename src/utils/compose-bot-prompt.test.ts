import { describe, expect, test } from "bun:test";
import composeBotPrompt from "./compose-bot-prompt";

describe("composeBotPrompt", () => {
    test("orders core instructions, the workspace, then memory", () => {
        expect(
            composeBotPrompt({
                system_prompt: "# You are Scout\n\nFind things.",
                memory: "- The user prefers short replies.",
                workspace: {
                    name: "Launch",
                    description: "The spring launch.",
                    system_prompt: "Ship by Friday.",
                },
                workspace_bot: {
                    system_prompt: "Own the changelog.",
                    memory: "- Marketing signs off on copy.",
                },
            }),
        ).toBe(
            [
                "# You are Scout\n\nFind things.",
                `# Workspace: Launch\n\nYou're working in the workspace "Launch". Follow its context and your instructions for it below, over your general habits where they differ.\n\nThe spring launch.\n\nShip by Friday.`,
                "# Your instructions in Launch\n\nOwn the changelog.",
                "# Memory\n\n- The user prefers short replies.",
                "# Memory in Launch\n\n- Marketing signs off on copy.",
            ].join("\n\n"),
        );
    });

    test("leaves out empty parts and has no workspace outside one", () => {
        expect(
            composeBotPrompt({
                system_prompt: "Core.",
                memory: "   ",
                workspace_bot: { system_prompt: "Ignored." },
            }),
        ).toBe("Core.");
        expect(composeBotPrompt({})).toBe("");
    });

    test("names an untitled workspace even when it has no context", () => {
        expect(composeBotPrompt({ workspace: { name: null } })).toBe(
            `# Workspace: Untitled\n\nYou're working in the workspace "Untitled". Follow its context and your instructions for it below, over your general habits where they differ.`,
        );
    });
});
