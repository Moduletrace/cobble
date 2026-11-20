import { afterAll, describe, expect, mock, test } from "bun:test";

let created = 0;
let next_id = 7;

mock.module("@/src/functions/backend/db/bot-suggestions/create-bot-suggestion", () => ({
    default: async () => {
        created++;
        return next_id++;
    },
}));

const { default: suggestNextStepsTool } = await import("./suggest-next-steps-tool");

afterAll(() => {
    mock.restore();
});

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

    test("suggests once per run, so a second call points at the buttons already up", async () => {
        created = 0;
        const seen: string[] = [];
        const once = suggestNextStepsTool({ user_id: 1, bot_id: 2, session_id: 3, onSuggest: ({ ref }) => seen.push(ref) });
        const signal = new AbortController().signal;

        const first = await once.run({ args: { steps: ["Write the report"] }, signal });
        const second = await once.run({ args: { steps: ["Write the report"] }, signal });

        expect(created).toBe(1);
        expect(seen).toHaveLength(1);
        expect(String(first)).toContain("Suggested 1 next step");
        expect(String(second)).toContain("already attached");
        expect(String(second)).toContain("send_reply");
    });
});