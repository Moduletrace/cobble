import { describe, expect, test } from "bun:test";
import computerToken from "./computer-token";

describe("computerToken", () => {
    test("is the same for a computer every time, and differs between computers and keys", () => {
        const a = computerToken({ computer_id: 3, key: "k" });

        expect(a).toMatch(/^[0-9a-f]{64}$/);
        expect(computerToken({ computer_id: "3", key: "k" })).toBe(a);
        expect(computerToken({ computer_id: 4, key: "k" })).not.toBe(a);
        expect(computerToken({ computer_id: 3, key: "other" })).not.toBe(a);
    });

    test("needs a key", () => {
        expect(() => computerToken({ computer_id: 1, key: "" })).toThrow();
    });
});
