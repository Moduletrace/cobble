import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import type { BotWithLastMessage } from "@/src/types";
import railBots from "./rail-bots";
import railWorkspaces from "./rail-workspaces";

describe("railBots", () => {
    test("drops the core instructions and memory", () => {
        const bots: BotWithLastMessage[] = [
            { id: 1, name: "Ada", system_prompt: "Long rules", memory: "Notes" },
        ];
        const [bot] = railBots({ bots });

        expect(bot).toEqual({ id: 1, name: "Ada", last_message_text: undefined });
    });

    test("cuts the last message to a plain one-line preview", () => {
        const bots: BotWithLastMessage[] = [
            { id: 1, last_message_text: `**Done.**\n\n${"word ".repeat(100)}` },
        ];
        const [bot] = railBots({ bots });

        expect(bot?.last_message_text?.startsWith("Done. word")).toBe(true);
        expect(bot?.last_message_text?.length).toBe(AppData.RailPreviewMaxChars);
    });
});

describe("railWorkspaces", () => {
    test("drops the shared context", () => {
        expect(
            railWorkspaces({
                workspaces: [{ id: 2, name: "Site", system_prompt: "Context", unread: 0 }],
            }),
        ).toEqual([{ id: 2, name: "Site", unread: 0 }]);
    });
});
