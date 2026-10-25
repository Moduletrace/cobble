import { describe, expect, test } from "bun:test";
import grabBotHookTools from "./grab-bot-hook-tools";

const names = (params: Partial<Parameters<typeof grabBotHookTools>[0]>) =>
    grabBotHookTools({ user_id: 1, bot_id: 2, computers: [], ...params }).map((tool) => tool.name);

describe("grabBotHookTools", () => {
    test("a hook call's own run gets no hook tools", () => {
        expect(names({ hooked: true, session_id: 3, onPropose: () => {} })).toEqual([]);
    });

    test("a run without a chat to confirm in can't propose", () => {
        expect(names({ session_id: 3 })).toEqual(["list_hooks", "search_hook_calls", "read_hook_call", "pause_hook", "delete_hook"]);
    });

    test("a chat reply can propose", () => {
        expect(names({ session_id: 3, onPropose: () => {} })).toContain("propose_hook");
    });

    test("a proposal never takes a signing secret", () => {
        const propose = grabBotHookTools({
            user_id: 1,
            bot_id: 2,
            computers: [],
            session_id: 3,
            onPropose: () => {},
        }).find((tool) => tool.name == "propose_hook")!;
        const parsed = propose.schema!.parse({
            title: "GitHub pushes",
            instructions: "Summarise each push.",
            signing_secret: "abcdefgh",
            reason: "The user asked for push summaries.",
        });

        expect(parsed).not.toHaveProperty("signing_secret");
    });
});
