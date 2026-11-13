import { describe, expect, test } from "bun:test";
import commandTimeoutSeconds from "./command-timeout";

describe("commandTimeoutSeconds", () => {
    test("has no limit when nothing is asked and the install sets none", () => {
        expect(commandTimeoutSeconds({ max: 0 })).toBeNull();
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

    test("an install limit caps what the bot asks for", () => {
        expect(commandTimeoutSeconds({ asked: 600, max: 270 })).toBe(270);
        expect(commandTimeoutSeconds({ asked: 60, max: 270 })).toBe(60);
    });
});