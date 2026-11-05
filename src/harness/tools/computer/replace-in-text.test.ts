import { describe, expect, test } from "bun:test";
import replaceInText from "./replace-in-text";

describe("replaceInText", () => {
    test("replaces text found once", () => {
        expect(replaceInText({ text: "a b c", old_text: "b", new_text: "$&x", replace_all: false })).toEqual({ ok: true, count: 1, text: "a $&x c" });
    });

    test("refuses text found more than once, unless asked for all", () => {
        expect(replaceInText({ text: "b b", old_text: "b", new_text: "c", replace_all: false })).toEqual({ ok: false, count: 2 });
        expect(replaceInText({ text: "b b", old_text: "b", new_text: "c", replace_all: true })).toEqual({ ok: true, count: 2, text: "c c" });
    });

    test("says when it isn't there", () => {
        expect(replaceInText({ text: "a", old_text: "b", new_text: "c", replace_all: true })).toEqual({ ok: false, count: 0 });
    });
});
