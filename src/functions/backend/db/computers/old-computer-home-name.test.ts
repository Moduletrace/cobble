import { describe, expect, test } from "bun:test";
import oldComputerHomeName from "./old-computer-home-name";

describe("oldComputerHomeName", () => {
    test("reads both names prepareComputerDataDir makes", () => {
        expect(oldComputerHomeName({ name: "4-home-1700000000000" })).toBe(1700000000000);
        expect(oldComputerHomeName({ name: "4-1700000000000" })).toBe(1700000000000);
    });

    test("ignores a live computer's own folder", () => {
        expect(oldComputerHomeName({ name: "4" })).toBeNull();
        expect(oldComputerHomeName({ name: "12" })).toBeNull();
    });

    test("ignores a file that only looks similar", () => {
        expect(oldComputerHomeName({ name: "4-home-1700000000000-workspace" })).toBeNull();
        expect(oldComputerHomeName({ name: "bots" })).toBeNull();
        expect(oldComputerHomeName({ name: "4-home-x" })).toBeNull();
        expect(oldComputerHomeName({ name: "x-1700000000000" })).toBeNull();
        expect(oldComputerHomeName({ name: "1700000000000-workspace" })).toBeNull();
    });
});