import { afterAll, describe, expect, mock, test } from "bun:test";

let created = 0;
let next_id = 41;
let last_params: Record<string, unknown> = {};

mock.module("@/src/functions/backend/db/bot-questions/create-bot-question", () => ({
    default: async (params: Record<string, unknown>) => {
        created++;
        last_params = params;
        return next_id++;
    },
}));

const { default: askUserTool } = await import("./ask-user-tool");

afterAll(() => {
    mock.restore();
});

const tool = askUserTool({ user_id: 1, bot_id: 2, session_id: 3, onAsk: () => {} });

const question = { question: "Which environment?", kind: "single" as const, options: ["Staging", "Production"] };

describe("askUserTool", () => {
    test("takes a set of questions", () => {
        expect(tool.schema?.safeParse({ title: "Before I deploy", questions: [question] }).success).toBe(true);
    });

    test("needs at least two distinct options", () => {
        expect(tool.schema?.safeParse({ questions: [{ ...question, options: ["Staging"] }] }).success).toBe(false);
        expect(tool.schema?.safeParse({ questions: [{ ...question, options: ["Staging", "staging"] }] }).success).toBe(false);
    });

    test("needs a known kind and at least one question", () => {
        expect(tool.schema?.safeParse({ questions: [{ ...question, kind: "ranked" }] }).success).toBe(false);
        expect(tool.schema?.safeParse({ questions: [] }).success).toBe(false);
    });

    test("caps how many questions one card holds", () => {
        expect(tool.schema?.safeParse({ questions: Array.from({ length: 7 }, () => question) }).success).toBe(false);
    });

    test("records Plan mode on the card, so the answer stays in it", async () => {
        last_params = {};
        const planned = askUserTool({ user_id: 1, bot_id: 2, session_id: 3, plan_mode: true, onAsk: () => {} });

        await planned.run({ args: { questions: [question] }, signal: new AbortController().signal });

        expect(last_params.plan_mode).toBe(true);
    });

    test("an ordinary card carries no Plan mode", async () => {
        last_params = {};
        const ordinary = askUserTool({ user_id: 1, bot_id: 2, session_id: 3, onAsk: () => {} });

        await ordinary.run({ args: { questions: [question] }, signal: new AbortController().signal });

        expect(last_params.plan_mode).toBe(false);
    });

    test("asks once per run, so a second call points at the card already up", async () => {
        /**
         * A model that re-asked while the loop asked it for `send_reply`
         * was refused by a thrown error, which the loop read as a failed
         * closing call: session 146 lost its whole answer to it. The card
         * is up either way, so the second call just says so.
         */
        created = 0;
        const refs: string[] = [];
        const once = askUserTool({ user_id: 1, bot_id: 2, session_id: 3, onAsk: ({ ref }) => refs.push(ref) });
        const signal = new AbortController().signal;

        const first = await once.run({ args: { questions: [question] }, signal });
        const second = await once.run({ args: { questions: [question] }, signal });

        expect(created).toBe(1);
        expect(refs).toHaveLength(1);
        expect(String(first)).toContain("Asked the user 1 question");
        expect(String(second)).toContain("already asked");
        expect(String(second)).toContain("send_reply");
    });
});