import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import commandTimeoutSeconds from "./command-timeout";

describe("commandTimeoutSeconds", () => {
    test("falls back to the default when nothing is asked and the install sets none", () => {
        expect(commandTimeoutSeconds({ max: 0 })).toBe(AppData.ComputerCommandDefaultSeconds);
    });

    test("unlimited means no limit when the install sets none", () => {
        expect(commandTimeoutSeconds({ asked: "unlimited", max: 0 })).toBeNull();
    });

    test("a bot's own timeout still applies with no install limit", () => {
        expect(commandTimeoutSeconds({ asked: 3600, max: 0 })).toBe(3600);
    });

    test("rounds a bot's timeout up to whole seconds, at least one", () => {
        expect(commandTimeoutSeconds({ asked: 0.2, max: 0 })).toBe(1);
        expect(commandTimeoutSeconds({ asked: 12.1, max: 0 })).toBe(13);
    });

    test("an install limit applies when the bot names none", () => {
        expect(commandTimeoutSeconds({ max: 270 })).toBe(270);
    });

    test("an install limit caps what the bot asks for, unlimited included", () => {
        expect(commandTimeoutSeconds({ asked: 600, max: 270 })).toBe(270);
        expect(commandTimeoutSeconds({ asked: 60, max: 270 })).toBe(60);
        expect(commandTimeoutSeconds({ asked: "unlimited", max: 270 })).toBe(270);
    });
});