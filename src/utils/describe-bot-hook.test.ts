import { describe, expect, test } from "bun:test";
import describeBotHook from "./describe-bot-hook";

describe("describeBotHook", () => {
    test("names a URL hook without any of its token", () => {
        const text = describeBotHook({
            hook: {
                id: 3,
                title: "GitHub pushes",
                source: "url",
                token_prefix: "hk_secretprefix",
                has_signing_secret: 1,
                enabled: 1,
                run_count: 2,
                last_called_at: Date.UTC(2026, 9, 25, 9, 0),
                workspace_name: "Launch",
            },
        });

        expect(text).toBe(
            `#3 "GitHub pushes", called at its URL (signed calls only), in the workspace Launch, on, 2 runs so far, last called 2026-10-25T09:00:00.000Z`,
        );
        expect(text).not.toContain("hk_secretprefix");
    });

    test("names a paused notification hook with its filter and last error", () => {
        expect(
            describeBotHook({
                hook: {
                    id: 4,
                    title: "Slack mentions",
                    source: "browser_notifications",
                    watch_computer_id: 2,
                    watch_computer_name: "Main",
                    watch_filter: "slack",
                    computer_id: 2,
                    enabled: 0,
                    run_count: 1,
                    last_error: "Timed out",
                },
            }),
        ).toBe(
            `#4 "Slack mentions", called by browser notifications on computer 2 (Main), only those containing "slack", in your own chat, on computer 2, paused, 1 run so far, never called, last error: Timed out`,
        );
    });
});
