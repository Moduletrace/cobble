import { describe, expect, test } from "bun:test";
import fileRefIds from "./file-ref-ids";
import rewriteFileRefs from "./rewrite-file-refs";

describe("fileRefIds", () => {
    test("finds each file ref once, in order", () => {
        expect(fileRefIds({ text: "See [file:330], [file:324] and [file:330] again. [bot:3]" })).toEqual([330, 324]);
    });

    test("finds none in a text without file refs", () => {
        expect(fileRefIds({ text: "[folder:bot:20:research] and file 12" })).toEqual([]);
    });
});

describe("rewriteFileRefs", () => {
    test("points the mapped refs at their copies and leaves the rest", () => {
        expect(
            rewriteFileRefs({
                text: "Doc [file:330], sheet [file:324], shared [file:466], again [file:330]",
                ids: new Map([
                    [330, 501],
                    [324, 502],
                ]),
            }),
        ).toBe("Doc [file:501], sheet [file:502], shared [file:466], again [file:501]");
    });

    test("leaves a text alone with nothing to map", () => {
        expect(rewriteFileRefs({ text: "[file:1]", ids: new Map() })).toBe("[file:1]");
    });
});
