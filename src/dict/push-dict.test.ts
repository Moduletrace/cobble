import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import {
    pushMessageTag,
    pushNeedsYouTag,
    truncatePushBody,
} from "./push-dict";

describe("push tags", () => {
    test("a conversation's notifications replace each other", () => {
        expect(pushMessageTag({ bot_id: 3, session_id: 9 })).toBe(
            "bot-3-session-9",
        );
    });

    test("needs-you has its own tag, so it does not replace a message", () => {
        expect(pushNeedsYouTag({ bot_id: 3 })).not.toBe(
            pushMessageTag({ bot_id: 3, session_id: 9 }),
        );
    });
});

describe("truncatePushBody", () => {
    test("keeps short text as is", () => {
        expect(truncatePushBody("On it.")).toBe("On it.");
    });

    test("cuts long text at the limit, with one ellipsis", () => {
        const long = "a".repeat(AppData.PushBodyMaxChars + 20);
        const cut = truncatePushBody(long);

        expect(cut.length).toBeLessThanOrEqual(AppData.PushBodyMaxChars);
        expect(cut.endsWith("…")).toBe(true);
    });
});
