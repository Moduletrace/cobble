import { describe, expect, test } from "bun:test";
import parseIdList from "./parse-id-list";

describe("parseIdList", () => {
    test("reads comma separated ids and drops the rest", () => {
        expect(parseIdList({ ids: "3,10, 7" })).toEqual([3, 10, 7]);
        expect(parseIdList({ ids: "x,0,-2,4" })).toEqual([4]);
        expect(parseIdList({ ids: null })).toEqual([]);
    });
});
