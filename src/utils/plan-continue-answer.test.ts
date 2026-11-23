import { describe, expect, test } from "bun:test";
import type { BotQuestionView } from "@/src/types";
import planContinueAnswer from "./plan-continue-answer";

function view({ status, choices }: { status: BotQuestionView["status"]; choices?: number[] }) {
    return {
        status,
        answers: choices ? [{ choices }] : undefined,
    } as unknown as BotQuestionView;
}

describe("planContinueAnswer", () => {
    test("the first option answers continue", () => {
        expect(planContinueAnswer({ view: view({ status: "answered", choices: [0] }) })).toBe(true);
    });

    test("pause, a second choice or a typed answer holds the plan", () => {
        expect(planContinueAnswer({ view: view({ status: "answered", choices: [1] }) })).toBe(false);
        expect(planContinueAnswer({ view: view({ status: "answered", choices: [] }) })).toBe(false);
        expect(planContinueAnswer({ view: view({ status: "answered" }) })).toBe(false);
    });

    test("a card still waiting, or skipped, holds it", () => {
        expect(planContinueAnswer({ view: view({ status: "pending" }) })).toBe(false);
        expect(planContinueAnswer({ view: view({ status: "skipped" }) })).toBe(false);
    });
});