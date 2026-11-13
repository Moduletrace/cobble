import { describe, expect, test } from "bun:test";
import suggestNextStepsTool from "./suggest-next-steps-tool";

const refs: string[] = [];
const tool = suggestNextStepsTool({ user_id: 1, bot_id: 2, session_id: 3, onSuggest: ({ ref }) => refs.push(ref) });

describe("suggestNextStepsTool", () => {
    test("takes a set of steps with an optional heading", () => {
        expect(tool.schema?.safeParse({ title: "What I can do next", steps: ["Write the report", "Email the team"] }).success).toBe(true);
        expect(tool.schema?.safeParse({ steps: ["Write the report"] }).success).toBe(true);
    });

    test("needs at least one step and no duplicates", () => {
        expect(tool.schema?.safeParse({ steps: [] }).success).toBe(false);
        expect(tool.schema?.safeParse({ steps: ["Write the report", "write the report"] }).success).toBe(false);
        expect(tool.schema?.safeParse({ steps: ["  "] }).success).toBe(false);
    });

    test("caps how many steps one row holds and how long each is", () => {
        expect(tool.schema?.safeParse({ steps: Array.from({ length: 5 }, (_, i) => `Step ${i}`) }).success).toBe(false);
        expect(tool.schema?.safeParse({ steps: ["x".repeat(121)] }).success).toBe(false);
    });
});