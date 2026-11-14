import { describe, expect, test } from "bun:test";
import { browserSettleTimeoutNote } from "@/src/data/harness-prompts";
import browserRecoveryHint from "./browser-recovery-hint";

const settle_timeout = `Error: ### Error
TimeoutError: browserBackend.callTool: Timeout 5000ms exceeded.
Call log:
  - waiting for locator('aria-ref=f30e587')
    - locator resolved to <button type="button" class="x1ghz6dp">…</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable`;

describe("browserRecoveryHint", () => {
    test("says to drive the page itself after a settle timeout", () => {
        expect(browserRecoveryHint({ name: "browser_click", text: settle_timeout })).toBe(browserSettleTimeoutNote);
    });

    test("covers a user's own browser too", () => {
        expect(browserRecoveryHint({ name: "laptop__browser_click", text: settle_timeout })).toBe(browserSettleTimeoutNote);
    });

    test("says nothing about a failure that already names its own fix", () => {
        const bad_target = `Error: ### Error
Error: "button "More account and team options"" is not a valid target. Use a ref from the page snapshot (e.g. "e5"), a CSS selector, or a locator.`;

        expect(browserRecoveryHint({ name: "browser_click", text: bad_target })).toBe("");
    });

    test("says nothing to a tool that is not a browser's", () => {
        expect(browserRecoveryHint({ name: "computer_bash", text: settle_timeout })).toBe("");
    });

    test("says nothing after a call that worked", () => {
        const clicked = "### Result\nClicked the button.\n### Page\n- Page URL: https://www.canva.com/";

        expect(browserRecoveryHint({ name: "browser_click", text: clicked })).toBe("");
    });
});