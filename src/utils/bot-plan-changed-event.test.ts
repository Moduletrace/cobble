import { describe, expect, test } from "bun:test";
import type { BotPlanView } from "@/src/types";
import announceBotPlanChanged, { BotPlanChangedEvent } from "./bot-plan-changed-event";

const plan = { id: 3, session_id: 133, title: "Plan", status: "cancelled" } as BotPlanView;

describe("announceBotPlanChanged", () => {
    test("tells every listener on the page about the plan", () => {
        const target = new EventTarget();
        const heard: BotPlanView[] = [];

        target.addEventListener(BotPlanChangedEvent, (event) => {
            heard.push((event as CustomEvent<{ plan: BotPlanView }>).detail.plan);
        });

        announceBotPlanChanged({ plan, target });

        expect(heard).toEqual([plan]);
    });

    test("says nothing where there is no page", () => {
        expect(() => announceBotPlanChanged({ plan, target: null })).not.toThrow();
    });
});