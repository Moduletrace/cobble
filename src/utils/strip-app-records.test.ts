import { describe, expect, test } from "bun:test";
import stripAppRecords from "./strip-app-records";

describe("stripAppRecords", () => {
    test("leaves an answer without records as it is", () => {
        expect(stripAppRecords({ text: "  Done. [Not a record]  " })).toBe("  Done. [Not a record]  ");
    });

    test("drops record lines the bot copied, wherever they are", () => {
        expect(
            stripAppRecords({
                text: "Saved.\n\n[App record: this message's run called update_bot]\n\nAnything else?\n  [App record: none]",
            }),
        ).toBe("Saved.\n\nAnything else?");
    });
});
