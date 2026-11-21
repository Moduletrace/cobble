import { describe, expect, test } from "bun:test";
import pickImportComputer from "./import-computer";

/**
 * A reply now imports from a computer, and a bot may reach several: the one
 * it names wins, and one it does not have is refused rather than quietly
 * reading the first machine's folder.
 */
const computers = [
    { id: 4, name: "Main" },
    { id: 9, name: "Build" },
];

describe("picking the computer to import from", () => {
    test("no computer is null", () => {
        expect(pickImportComputer({ computers: [] })).toBeNull();
    });

    test("nothing named means the first one", () => {
        expect(pickImportComputer({ computers })?.id).toEqual(4);
        expect(pickImportComputer({ computers, wanted: "  " })?.id).toEqual(4);
    });

    test("an id picks that computer", () => {
        expect(pickImportComputer({ computers, wanted: 9 })?.id).toEqual(9);
        expect(pickImportComputer({ computers, wanted: "9" })?.id).toEqual(9);
    });

    test("a computer ref picks it too", () => {
        expect(pickImportComputer({ computers, wanted: "computer:9" })?.id).toEqual(9);
    });

    test("one it does not have is null, not the first one", () => {
        expect(pickImportComputer({ computers, wanted: 2 })).toBeNull();
        expect(pickImportComputer({ computers, wanted: "elsewhere" })).toBeNull();
    });
});