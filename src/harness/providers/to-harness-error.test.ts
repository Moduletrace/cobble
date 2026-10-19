import { describe, expect, test } from "bun:test";
import toHarnessError from "./to-harness-error";

describe("toHarnessError", () => {
    test("rate limits are retryable and say when to come back", () => {
        const error = toHarnessError({
            status: 429,
            body: JSON.stringify({
                error: {
                    message: "Rate limit exceeded: free-models-per-day",
                    code: 429,
                },
            }),
            headers: new Headers({ "retry-after": "10" }),
            provider_name: "OpenRouter",
        });

        expect(error.message).toBe(
            "OpenRouter: Rate limit exceeded: free-models-per-day",
        );
        expect(error.retryable).toBe(true);
        expect(error.provider_wide).toBe(false);
        expect(error.retry_at).toBeGreaterThan(Date.now());
    });

    test("bad keys and missing credits are provider-wide, not retryable", () => {
        for (const status of [401, 402]) {
            const error = toHarnessError({ status, provider_name: "OpenAI" });

            expect(error.provider_wide).toBe(true);
            expect(error.retryable).toBe(false);
        }
    });

    test("a 403 is about the model, not the provider", () => {
        const error = toHarnessError({
            status: 403,
            body: JSON.stringify({
                error: {
                    message:
                        "thinkingmachines/inkling-small:free is only available on agentic harnesses.",
                },
            }),
            provider_name: "OpenRouter",
        });

        expect(error.provider_wide).toBe(false);
        expect(error.retryable).toBe(false);
    });

    test("outages are retryable; bad requests are not", () => {
        expect(toHarnessError({ status: 503, provider_name: "x" }).retryable).toBe(
            true,
        );
        expect(toHarnessError({ status: 404, provider_name: "x" }).retryable).toBe(
            false,
        );
    });

    test("adds the upstream detail OpenRouter nests in metadata", () => {
        const error = toHarnessError({
            status: 400,
            body: JSON.stringify({
                error: {
                    message: "Provider returned error",
                    metadata: { raw: "tools are not supported" },
                },
            }),
            provider_name: "OpenRouter",
        });

        expect(error.message).toBe(
            "OpenRouter: Provider returned error (tools are not supported)",
        );
    });

    test("falls back to plain bodies and the status", () => {
        expect(
            toHarnessError({ status: 500, body: "boom", provider_name: "x" })
                .message,
        ).toBe("x: boom");
        expect(toHarnessError({ status: 500, provider_name: "x" }).message).toBe(
            "x: HTTP 500",
        );
    });
});
