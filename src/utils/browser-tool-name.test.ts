import { describe, expect, test } from "bun:test";
import isBrowserTool from "./browser-tool-name";

describe("isBrowserTool", () => {
    test("knows the computer's and a user's browser tools", () => {
        expect(isBrowserTool({ name: "browser_evaluate" })).toBe(true);
        expect(isBrowserTool({ name: "my_debian_pc_chromium__browser_navigate" })).toBe(true);
        expect(isBrowserTool({ name: "computer_bash" })).toBe(false);
        expect(isBrowserTool({ name: "exa_search__web_fetch_exa" })).toBe(false);
        expect(isBrowserTool({ name: "notbrowser_x" })).toBe(false);
    });

    test("matches one action exactly", () => {
        expect(isBrowserTool({ name: "browser_snapshot", action: "browser_snapshot" })).toBe(true);
        expect(isBrowserTool({ name: "pc__browser_snapshot", action: "browser_snapshot" })).toBe(true);
        expect(isBrowserTool({ name: "browser_snapshot_x", action: "browser_snapshot" })).toBe(false);
        expect(isBrowserTool({ name: "browser_click", action: "browser_snapshot" })).toBe(false);
    });
});
