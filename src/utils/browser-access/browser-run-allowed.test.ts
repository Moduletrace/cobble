import { describe, expect, test } from "bun:test";
import browserRunAllowed from "./browser-run-allowed";

/**
 * The gate H7 leans on: only a run someone follows reaches a user's real
 * browser, and a routine only with its owner's allowance. A hook call or a
 * crew request's run (unattended) never does, allowance or not.
 */
describe("browserRunAllowed", () => {
    test("an attended run always reaches the browser", () => {
        expect(browserRunAllowed({ run_kind: "attended" })).toBe(true);
        expect(browserRunAllowed({ run_kind: "attended", allow_routines: false })).toBe(true);
    });

    test("a routine reaches it only with the owner's allowance", () => {
        expect(browserRunAllowed({ run_kind: "routine", allow_routines: true })).toBe(true);
        expect(browserRunAllowed({ run_kind: "routine", allow_routines: 1 })).toBe(true);
        expect(browserRunAllowed({ run_kind: "routine", allow_routines: false })).toBe(false);
        expect(browserRunAllowed({ run_kind: "routine", allow_routines: 0 })).toBe(false);
        expect(browserRunAllowed({ run_kind: "routine", allow_routines: "" })).toBe(false);
        expect(browserRunAllowed({ run_kind: "routine", allow_routines: null })).toBe(false);
        expect(browserRunAllowed({ run_kind: "routine" })).toBe(false);
    });

    test("an unattended run never reaches it, even with the allowance", () => {
        expect(browserRunAllowed({ run_kind: "unattended" })).toBe(false);
        expect(browserRunAllowed({ run_kind: "unattended", allow_routines: true })).toBe(false);
        expect(browserRunAllowed({ run_kind: "unattended", allow_routines: 1 })).toBe(false);
    });
});