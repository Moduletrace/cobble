import { describe, expect, test } from "bun:test";
import isComputerDown from "./computer-down";

describe("isComputerDown", () => {
    test("states that need someone to bring the computer back", () => {
        expect(isComputerDown({ status: "failed" })).toBe(true);
        expect(isComputerDown({ status: "dead" })).toBe(true);
        expect(isComputerDown({ status: "exited" })).toBe(true);
    });

    test("states that pass by themselves", () => {
        expect(isComputerDown({ status: "creating" })).toBe(false);
        expect(isComputerDown({ status: "created" })).toBe(false);
        expect(isComputerDown({ status: "starting" })).toBe(false);
        expect(isComputerDown({ status: "restarting" })).toBe(false);
        expect(isComputerDown({ status: "unhealthy" })).toBe(false);
        expect(isComputerDown({ status: "unknown" })).toBe(false);
        expect(isComputerDown({ status: "running" })).toBe(false);
    });
});
