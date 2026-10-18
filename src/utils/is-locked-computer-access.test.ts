import { describe, expect, test } from "bun:test";
import isLockedComputerAccess from "./is-locked-computer-access";

describe("isLockedComputerAccess", () => {
    test("locks the coordinator to the main computer", () => {
        expect(
            isLockedComputerAccess({
                bot_kind: "coordinator",
                computer_kind: "main",
            }),
        ).toBe(true);
    });

    test("leaves every other pair removable", () => {
        expect(
            isLockedComputerAccess({ bot_kind: "worker", computer_kind: "main" }),
        ).toBe(false);
        expect(
            isLockedComputerAccess({
                bot_kind: "coordinator",
                computer_kind: "sandbox",
            }),
        ).toBe(false);
        expect(
            isLockedComputerAccess({
                bot_kind: "worker",
                computer_kind: "sandbox",
            }),
        ).toBe(false);
        expect(isLockedComputerAccess({})).toBe(false);
    });
});
