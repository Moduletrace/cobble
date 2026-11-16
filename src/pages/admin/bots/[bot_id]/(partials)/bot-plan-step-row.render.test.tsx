import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import BotPlanStepRow from "./bot-plan-step-row";

/**
 * A plan's card reads at a glance: what each step is, which one the bot is
 * on, and what a finished one produced. The note is the app's own record of
 * the work, so it shows under the step it belongs to.
 */
const step = (overrides: Partial<{ text: string; state: "done" | "skipped" | "pending"; note: string }> = {}) => ({
    text: "Collect the pages",
    state: "pending" as const,
    note: "",
    ...overrides,
});

describe("BotPlanStepRow", () => {
    test("a finished step carries what it produced", () => {
        const html = renderToString(<BotPlanStepRow step={step({ state: "done", note: "14 pages" })} current={false} />);

        expect(html).toContain("Collect the pages");
        expect(html).toContain("14 pages");
    });

    test("the step being worked says so, until it has a note", () => {
        expect(renderToString(<BotPlanStepRow step={step()} current={false} />)).not.toContain("Working on this now.");

        expect(renderToString(<BotPlanStepRow step={step()} current />)).toContain("Working on this now.");
    });

    test("a skipped step is behind the plan like a done one", () => {
        const html = renderToString(<BotPlanStepRow step={step({ state: "skipped" })} current={false} />);

        expect(html).toContain("Collect the pages");
        expect(html).not.toContain("Working on this now.");
    });
});