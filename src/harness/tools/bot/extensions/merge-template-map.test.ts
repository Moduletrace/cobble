import { describe, expect, test } from "bun:test";
import mergeTemplateMap from "./merge-template-map";

describe("mergeTemplateMap", () => {
    test("sets, replaces and removes entries, keeping the rest", () => {
        expect(
            mergeTemplateMap({
                current: { A: "1", B: "2", C: "3" },
                changes: { B: "two", C: null, D: "4" },
            }),
        ).toEqual({ A: "1", B: "two", D: "4" });
    });

    test("leaves the map alone without changes", () => {
        expect(mergeTemplateMap({ current: { A: "1" } })).toEqual({ A: "1" });
    });
});
