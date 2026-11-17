import { describe, expect, test } from "bun:test";
import liveFileRefIds from "./live-file-ref-ids";

describe("liveFileRefIds", () => {
    test("finds each rendered file ref once, in order", () => {
        expect(liveFileRefIds({ text: "See [file:330], [file:324] and [file:330] again. [bot:3]" })).toEqual([
            330, 324,
        ]);
    });

    test("counts a ref quoted alone in a code span", () => {
        expect(liveFileRefIds({ text: "saved as `[file:131]` today" })).toEqual([131]);
        expect(liveFileRefIds({ text: "see `` [file:7] ``" })).toEqual([7]);
    });

    test("leaves out refs inside longer code", () => {
        expect(liveFileRefIds({ text: "write `[file:3] here` like so" })).toEqual([]);
        expect(liveFileRefIds({ text: "```\n[file:2]\n```\nthen [file:2]" })).toEqual([2]);
        expect(liveFileRefIds({ text: "~~~\n[file:9]\n~~~" })).toEqual([]);
    });

    test("text on either side of a code span can't merge into a ref", () => {
        expect(liveFileRefIds({ text: "[file:`x`1]" })).toEqual([]);
    });

    test("counts refs already written as links", () => {
        expect(liveFileRefIds({ text: "the [file:5](https://example.com) report" })).toEqual([5]);
    });

    test("finds none in a text without live file refs", () => {
        expect(liveFileRefIds({ text: "[folder:bot:20:research] and file 12" })).toEqual([]);
        expect(liveFileRefIds({ text: "" })).toEqual([]);
    });
});
