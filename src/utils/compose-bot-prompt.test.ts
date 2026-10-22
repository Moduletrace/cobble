import { describe, expect, test } from "bun:test";
import composeBotPrompt from "./compose-bot-prompt";

describe("composeBotPrompt", () => {
    test("orders core instructions, the workspace, then memory", () => {
        expect(
            composeBotPrompt({
                system_prompt: "# You are Scout\n\nFind things.",
                memory: "- Cite sources.",
                user_memory: "- The user prefers short replies.",
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
                `# Workspace: Launch\n\nYou're working in the workspace "Launch". Follow its context and your instructions for it below, over your general habits where they differ.\n\nThe workspace's context, which the user sets:\n\nThe spring launch.\n\nShip by Friday.`,
                "# Your instructions in Launch\n\nOwn the changelog.",
                "# Memory\n\n- Cite sources.",
                "# Memory about the user\n\n- The user prefers short replies.",
                `# Memory in Launch\n\nYour own notes for this workspace: what you have learned here. They are not the workspace's description or context, which the user sets above; never call them the workspace's record. The user reads them in the workspace's settings, under this bot's row.\n\n- Marketing signs off on copy.`,
            ].join("\n\n"),
        );
    });

    test("puts the install-wide appendix right after the core instructions", () => {
        expect(
            composeBotPrompt({
                system_prompt: "Core.",
                appendix: "Never invent sources.",
                workspace: { name: "Launch", description: "The spring launch." },
                memory: "- Cite sources.",
            }),
        ).toBe(
            [
                "Core.",
                "# Install-wide instructions\n\nNever invent sources.",
                `# Workspace: Launch\n\nYou're working in the workspace "Launch". Follow its context and your instructions for it below, over your general habits where they differ.\n\nThe workspace's context, which the user sets:\n\nThe spring launch.`,
                "# Memory\n\n- Cite sources.",
            ].join("\n\n"),
        );
    });

    test("shows an appendix on its own and ignores a blank one", () => {
        expect(composeBotPrompt({ appendix: "Be brief." })).toBe(
            "# Install-wide instructions\n\nBe brief.",
        );
        expect(composeBotPrompt({ system_prompt: "Core.", appendix: "   " })).toBe("Core.");
    });

    test("leaves out empty parts and has no workspace outside one", () => {
        expect(
            composeBotPrompt({
                system_prompt: "Core.",
                memory: "   ",
                user_memory: "",
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
