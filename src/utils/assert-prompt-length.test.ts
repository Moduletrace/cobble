import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import assertPromptLength from "./assert-prompt-length";

describe("assertPromptLength", () => {
    test("allows text up to the cap", () => {
        expect(() =>
            assertPromptLength({
                label: "Memory",
                text: "a".repeat(AppData.PromptMaxLength),
            }),
        ).not.toThrow();
        expect(() => assertPromptLength({ label: "Memory" })).not.toThrow();
    });

    test("rejects text over the cap", () => {
        expect(() =>
            assertPromptLength({
                label: "Memory",
                text: "a".repeat(AppData.PromptMaxLength + 1),
            }),
        ).toThrow("Memory is too long");
    });
});
