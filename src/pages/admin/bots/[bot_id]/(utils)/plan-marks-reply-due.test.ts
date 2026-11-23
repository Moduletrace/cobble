import { describe, expect, test } from "bun:test";
import type { BotPlanView } from "@/src/types";
import planMarksReplyDue from "./plan-marks-reply-due";

const plan = (status: BotPlanView["status"]) => ({ id: 7, status }) as BotPlanView;

describe("planMarksReplyDue", () => {
    test("a plan that started has a step reply on its way", () => {
        expect(planMarksReplyDue({ plan: plan("active") })).toBe(true);
    });

    test("approving is what starts it: one waiting for the user does not", () => {
        expect(planMarksReplyDue({ plan: plan("planned") })).toBe(false);
    });

    test("a plan stopped between steps has nothing on its way", () => {
        expect(planMarksReplyDue({ plan: plan("paused") })).toBe(false);
        expect(planMarksReplyDue({ plan: plan("done") })).toBe(false);
        expect(planMarksReplyDue({ plan: plan("cancelled") })).toBe(false);
    });

    test("no plan in the conversation at all is no reply", () => {
        expect(planMarksReplyDue({ plan: null })).toBe(false);
        expect(planMarksReplyDue({})).toBe(false);
    });
});