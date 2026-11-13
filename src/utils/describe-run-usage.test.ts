import { describe, expect, test } from "bun:test";
import type { RunUsage } from "@/src/functions/backend/db/usage/grab-run-usage";
import describeRunUsage, { describeMessageUsageList } from "./describe-run-usage";

const usage: RunUsage = {
    target: { kind: "message", id: 41, created_at: 1_760_000_000_000, author: "bot", text: "Done." },
    totals: {
        calls: 3,
        prompt_tokens: 180_000,
        cached_tokens: 150_000,
        completion_tokens: 4000,
        total_tokens: 184_000,
        cost: 0.42,
    },
    calls: [
        {
            id: 9,
            created_at: 1_760_000_000_000,
            harness: "text",
            provider_name: "OpenRouter",
            model_slug: "openai/gpt-5",
            prompt_tokens: 60_000,
            cached_tokens: 50_000,
            completion_tokens: 1400,
            settings: { model_source: "pinned", limits: { steps: 60, run_tokens: 250_000, context_tokens: 120_000 } },
        },
    ],
    tools: {
        calls: 3,
        failed: 1,
        tools: [{ name: "computer_bash", label: "Shell", count: 3, failed: 1 }],
    },
    limits: { steps: 60, run_tokens: 250_000, context_tokens: 120_000 },
    current_limits: { task_steps: 60, reply_steps: 20, unattended_steps: 12, run_tokens: 250_000, context_tokens: 120_000 },
};

describe("describeRunUsage", () => {
    test("explains what an answer cost, what bounded it and where to change it", () => {
        const text = describeRunUsage({ usage });

        expect(text).toContain("# Message #41");
        expect(text).toContain("3 model calls: 180,000 prompt tokens (150,000 served from the model's cache)");
        expect(text).toContain("The run was allowed 60 steps");
        expect(text).toContain("Today's settings: 60 steps per task, 20 per reply");
        expect(text).toContain("[setting:run-limits:run_tokens]");
        expect(text).toContain("computer_bash 3 (1 failed)");
    });

    test("says a limit is unlimited, not that it was never recorded", () => {
        const text = describeRunUsage({
            usage: {
                ...usage,
                limits: { steps: "unlimited", run_tokens: 250_000, context_tokens: "unlimited" },
                current_limits: {
                    task_steps: "unlimited",
                    reply_steps: 20,
                    unattended_steps: "unlimited",
                    run_tokens: 250_000,
                    context_tokens: 120_000,
                },
            },
        });

        expect(text).toContain("The run was allowed unlimited steps, 250,000 prompt tokens in all, and unlimited tokens of working context per turn.");
        expect(text).toContain("Today's settings: unlimited steps per task, 20 per reply, unlimited per routine or hook call");
    });

    test("a call recorded before runs kept their limits says so", () => {
        expect(describeRunUsage({ usage: { ...usage, limits: null } })).toContain("recorded no limits");
    });

    test("nothing found is said plainly", () => {
        const text = describeRunUsage({ usage: { ...usage, target: null } });

        expect(text).toBe("# Nothing found\n\nThat message or run has no model calls recorded, so there is nothing to explain.");
    });
});

describe("describeMessageUsageList", () => {
    test("lists the session's messages with what each cost", () => {
        expect(
            describeMessageUsageList({
                messages: [
                    {
                        id: 41,
                        created_at: 1_760_000_000_000,
                        author: "bot",
                        prompt_tokens: 180_000,
                        completion_tokens: 4000,
                        total_tokens: 184_000,
                        calls: 3,
                    },
                ],
            }),
        ).toContain("- #41");
    });

    test("says so when there is nothing yet", () => {
        expect(describeMessageUsageList({ messages: [] })).toBe("No messages with model calls yet.");
    });
});