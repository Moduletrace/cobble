import { afterAll, describe, expect, mock, test } from "bun:test";
import type { BotHookWithNames } from "@/src/types";

/**
 * The gate in front of pause_hook and delete_hook. A worker must never
 * touch another bot's hook; the coordinator may, since the user made it
 * responsible for the whole crew. Everything of the user's is still the
 * only thing it can reach.
 */
const hook = { id: 7, title: "GitHub pushes", bot_id: 4 } as BotHookWithNames;

mock.module("@/src/functions/backend/db/bot-hooks/grab-user-bot-hook", () => ({
    default: async () => hook,
}));

const grabOwnHook = (await import("./grab-own-hook")).default;

afterAll(() => {
    mock.restore();
});

describe("grabOwnHook", () => {
    test("a worker gets its own hook", async () => {
        expect((await grabOwnHook({ user_id: 1, bot_id: 4, hook_id: 7 })).id).toBe(7);
    });

    test("a worker is refused another bot's hook", async () => {
        await expect(grabOwnHook({ user_id: 1, bot_id: 9, hook_id: 7 })).rejects.toThrow("isn't one of yours");
    });

    test("the coordinator reaches any of the user's hooks", async () => {
        expect((await grabOwnHook({ user_id: 1, bot_id: 1, hook_id: 7, is_coordinator: true })).id).toBe(7);
    });
});