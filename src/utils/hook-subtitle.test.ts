import { describe, expect, test } from "bun:test";
import type { BotHookWithNames } from "@/src/types";
import hookSubtitle from "./hook-subtitle";

const now = Date.UTC(2026, 9, 25, 12, 0, 0);

describe("hookSubtitle", () => {
    test("a hook never called", () => {
        const hook = { bot_name: "Scout", run_count: 0 } as BotHookWithNames;

        expect(hookSubtitle({ hook, now })).toBe("Scout · 0 runs · never called");
    });

    test("a browser-notification hook names its computer and filter", () => {
        const hook = {
            bot_name: "Scout",
            source: "browser_notifications",
            watch_computer_name: "Main computer",
            watch_filter: "mail.google.com",
            run_count: 2,
        } as BotHookWithNames;

        expect(hookSubtitle({ hook, now })).toBe(
            'Scout · notifications on Main computer with "mail.google.com" · 2 runs · never called',
        );
    });

    test("a signed hook, called, with its last error, in a conversation", () => {
        const hook = {
            bot_name: "Scout",
            workspace_name: "Launch",
            run_count: 1,
            last_called_at: now - 5 * 60 * 1000,
            has_signing_secret: 1,
            last_error: "This hook is paused.",
        } as BotHookWithNames;

        expect(hookSubtitle({ hook, now, show_bot: false, show_workspace: false })).toBe(
            "1 run · called 5m · signed · This hook is paused.",
        );
    });

    test("a hook with a session of its own names it", () => {
        const hook = { bot_name: "Scout", session_id: 9, session_title: "Hook: Issues", run_count: 1 } as BotHookWithNames;

        expect(hookSubtitle({ hook, now })).toBe('Scout · in "Hook: Issues" · 1 run · never called');
    });
});
