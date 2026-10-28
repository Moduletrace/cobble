import { describe, expect, test } from "bun:test";
import askUserTool from "./ask-user-tool";

const tool = askUserTool({ user_id: 1, bot_id: 2, session_id: 3, onAsk: () => {} });

const question = { question: "Which environment?", kind: "single", options: ["Staging", "Production"] };

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
});
