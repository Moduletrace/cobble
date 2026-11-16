import { describe, expect, test } from "bun:test";
import stripAppRecords, { AppRecordPrefix, appRecordLines } from "./strip-app-records";

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

    test("keeps the phrase when it sits inside a sentence: the bot naming what it got wrong", () => {
        const quoted = `You're right - I wrote a fake "${AppRecordPrefix} ...]" line in my earlier message.`;

        expect(stripAppRecords({ text: quoted })).toBe(quoted);
    });
});

describe("appRecordLines", () => {
    test("reads only the lines in the app's own shape", () => {
        expect(
            appRecordLines({
                text:
                    "Saved.\n\n[App record: this message's run called update_bot]\n\n"
                    + 'The line I made up was a fake "[App record: ...]" one, and `[App record: ...]` is its shape.',
            }),
        ).toEqual(["[App record: this message's run called update_bot]"]);
    });

    test("finds nothing where there is no prefix", () => {
        expect(appRecordLines({ text: "Nothing here." })).toEqual([]);
    });
});
