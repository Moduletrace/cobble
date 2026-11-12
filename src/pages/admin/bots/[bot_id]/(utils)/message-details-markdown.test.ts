import { describe, expect, test } from "bun:test";
import type { HarnessCallSettings } from "@/src/harness/usage/types";
import type { MessageDetails, MessageDetailsCall, MessageDetailsFailure } from "@/src/types";
import messageDetailsMarkdown from "./message-details-markdown";

const format_time = (time: number) => `t${time}`;

const settings: HarnessCallSettings = {
    model_source: "pinned",
    settings_source: "bot",
    params: { temperature: 0.3 },
};

function call(overrides: Partial<MessageDetailsCall>): MessageDetailsCall {
    return {
        id: 1,
        created_at: 1_000,
        harness: "text",
        provider_id: 1,
        provider_name: "OpenRouter",
        provider_kind: "openrouter",
        model_slug: "deepseek/deepseek-v4",
        model_name: "DeepSeek V4",
        prompt_tokens: 1_200,
        cached_tokens: 200,
        completion_tokens: 80,
        cost: 0.0123,
        settings,
        ...overrides,
    };
}

function failure(overrides: Partial<MessageDetailsFailure>): MessageDetailsFailure {
    return {
        id: 1,
        created_at: 1_000,
        harness: "text",
        provider_name: "OpenRouter",
        provider_kind: "openrouter",
        model_slug: "deepseek/deepseek-v4",
        model_name: "DeepSeek V4",
        source: "pinned",
        status: 429,
        error: "Rate limited\nTry again later",
        rests_until: 61_000,
        ...overrides,
    };
}

function details(overrides: Partial<MessageDetails>): MessageDetails {
    return {
        message_id: 42,
        created_at: 5_000,
        totals: { prompt_tokens: 1_200, completion_tokens: 80, total_tokens: 1_280, calls: 1 },
        models: [],
        calls: [],
        failures: [],
        failed_calls: 0,
        job: null,
        ...overrides,
    };
}

describe("messageDetailsMarkdown", () => {
    test("heads the report with the message, its totals and when it was copied", () => {
        const markdown = messageDetailsMarkdown({
            details: details({
                totals: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, calls: 0 },
            }),
            now: 9_000,
            format_time,
        });

        expect(markdown).toContain("# Message details");
        expect(markdown).toContain("- **Message:** #42");
        expect(markdown).toContain("- **Written:** t5000");
        expect(markdown).toContain("- **Tokens:** 0 (0 in, 0 out)");
        expect(markdown).toContain("- **Copied:** t9000");
        expect(markdown).toContain("No model calls were recorded for this message.");
    });

    test("lists every call in a table, with its offset and fallback mark", () => {
        const markdown = messageDetailsMarkdown({
            details: details({
                totals: { prompt_tokens: 1_300, completion_tokens: 90, total_tokens: 1_390, calls: 2 },
                calls: [
                    call({ id: 1, created_at: 1_000 }),
                    call({
                        id: 2,
                        created_at: 5_200,
                        prompt_tokens: 100,
                        completion_tokens: 10,
                        settings: { ...settings, fell_back_from: ["openrouter:big"] },
                    }),
                ],
            }),
            now: 9_000,
            format_time,
        });

        expect(markdown).toContain("| # | At | Model | Harness | Prompt | Cached | Completion | Cost |");
        expect(markdown).toContain("| 1 | start | DeepSeek V4 (deepseek/deepseek-v4) | Text | 1,200 | 200 | 80 | $0.0123 |");
        expect(markdown).toContain("| 2 | +4.2s | DeepSeek V4 (deepseek/deepseek-v4) (fallback) | Text | 100 | 200 | 10 | $0.0123 |");
    });

    test("quotes a failed call's error line by line and names what rested", () => {
        const markdown = messageDetailsMarkdown({
            details: details({ failures: [failure({})], failed_calls: 1 }),
            now: 9_000,
            format_time,
        });

        expect(markdown).toContain("## Failed call");
        expect(markdown).toContain("### Failure #1 · start");
        expect(markdown).toContain("- **Status:** HTTP 429");
        expect(markdown).toContain("- **Rested for:** 1m");
        expect(markdown).toContain("> Rate limited\n> Try again later");
    });

    test("sums each model with its settings in a table", () => {
        const markdown = messageDetailsMarkdown({
            details: details({
                models: [
                    {
                        harness: "text",
                        provider_name: "OpenRouter",
                        provider_kind: "openrouter",
                        model_slug: "deepseek/deepseek-v4",
                        model_name: "DeepSeek V4",
                        settings,
                        prompt_tokens: 1_200,
                        completion_tokens: 80,
                        total_tokens: 1_280,
                        calls: 1,
                        cost: 0.0123,
                    },
                ],
            }),
            now: 9_000,
            format_time,
        });

        expect(markdown).toContain("## Model used");
        expect(markdown).toContain("### DeepSeek V4");
        expect(markdown).toContain("- **Provider:** OpenRouter");
        expect(markdown).toContain("| Setting | Value |");
        expect(markdown).toContain("| Temperature | 0.3 |");
    });

    test("spells out the run behind the message", () => {
        const markdown = messageDetailsMarkdown({
            details: details({
                job: {
                    id: 7,
                    kind: "task",
                    title: "Weekly report",
                    status: "completed",
                    attempts: 1,
                    started_at: 1_000,
                    finished_at: 181_000,
                    steps: 12,
                },
            }),
            now: 200_000,
            format_time,
        });

        expect(markdown).toContain("## Run");
        expect(markdown).toContain("- **Id:** #7");
        expect(markdown).toContain("- **Kind:** Task");
        expect(markdown).toContain("- **Title:** Weekly report");
        expect(markdown).toContain("- **Took:** 3m");
        expect(markdown).toContain("- **Steps:** 12");
    });

    test("says when the report lists fewer calls than were made", () => {
        const markdown = messageDetailsMarkdown({
            details: details({
                totals: { prompt_tokens: 1_200, completion_tokens: 80, total_tokens: 1_280, calls: 5 },
                calls: [call({})],
            }),
            now: 9_000,
            format_time,
        });

        expect(markdown).toContain("Showing the first 1 of 5 calls. The totals count every one.");
    });

    test("keeps a pipe in a model name from breaking a table cell", () => {
        const markdown = messageDetailsMarkdown({
            details: details({
                calls: [call({ model_name: "A|B" })],
                totals: { prompt_tokens: 1_200, completion_tokens: 80, total_tokens: 1_280, calls: 1 },
            }),
            now: 9_000,
            format_time,
        });

        expect(markdown).toContain("A\\|B");
    });
});
