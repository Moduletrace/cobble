import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type { RunLimitsOverview } from "@/src/types";
import RunLimitsForm from "./run-limits-form";

const limits: RunLimitsOverview = {
    task_steps: "unlimited",
    reply_steps: "unlimited",
    unattended_steps: "unlimited",
    run_tokens: 250_000,
    context_tokens: 120_000,
    model_rest_seconds: 120,
    task_default: "unlimited",
    reply_default: "unlimited",
    unattended_default: "unlimited",
    run_tokens_default: 250_000,
    context_tokens_default: 120_000,
    model_rest_default: 120,
    max: 10_000,
    run_tokens_min: 100_000,
    run_tokens_max: 100_000_000,
    context_tokens_min: 40_000,
    context_tokens_max: 1_000_000,
    model_rest_min: 10,
    model_rest_max: 3600,
};

describe("RunLimitsForm", () => {
    test("gives every field its label", () => {
        const html = renderToString(<RunLimitsForm limits={limits} />);

        for (const label of [
            "Tool steps per task",
            "Tool steps per chat reply",
            "Tool steps per routine or hook call",
            "Tokens per run",
            "Working context",
            "Model rest after a failure",
        ]) {
            expect(html).toContain(`twui-input-label">${label}</label>`);
        }
    });

    test("reads a limit that's off as Unlimited, with its switch on", () => {
        const html = renderToString(<RunLimitsForm limits={limits} />);

        expect(html).toContain("Save limits");
        expect(html).toContain(`id="task_steps"`);
        expect(html).toContain(`type="text"`);
        expect(html).toContain(`value="Unlimited"`);
        expect(html).toContain("disabled");
        expect(html).toContain("0 uses the default (unlimited)");
    });

    test("shows a limit that's set as its number, with a switch to turn it off", () => {
        const html = renderToString(<RunLimitsForm limits={limits} />);

        expect(html).toContain(`value="250000"`);
        expect(html).toContain("250,000");
        expect(html).toContain("0 uses the default (250,000)");
    });
});