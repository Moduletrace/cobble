import { describe, expect, test } from "bun:test";
import computerNotReadyMessage from "./computer-not-ready-message";

describe("computerNotReadyMessage", () => {
    test("names the computer and its state", () => {
        expect(computerNotReadyMessage({ name: "Main computer", status: "starting" })).toBe(
            "Main computer isn't ready yet: it's starting.",
        );
    });

    test("falls back to a generic name", () => {
        expect(computerNotReadyMessage({ status: "creating" })).toBe("The computer isn't ready yet: it's creating.");
    });

    test("says a computer that's down needs bringing back", () => {
        expect(computerNotReadyMessage({ name: "Main computer", status: "failed" })).toBe(
            "Main computer is down (failed). A super admin can Restart or Retry it in Settings > Computers.",
        );
    });
});
