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

    test("a key the provider echoes back is masked, not shown (M8)", () => {
        const error = toHarnessError({
            status: 401,
            body: JSON.stringify({
                error: {
                    message:
                        "Incorrect API key provided: sk-proj-abc123def456ghi789jkl012mno345pqr678. You can find your API key at https://platform.openai.com/account/api-keys.",
                },
            }),
            provider_name: "LiteLLM",
        });

        expect(error.message).not.toContain("sk-proj-abc123");
        expect(error.message).toContain("[redacted]");
        expect(error.message).toContain("Incorrect API key provided");
    });

    test("a key nested in metadata.raw is masked too (M8)", () => {
        const error = toHarnessError({
            status: 400,
            body: JSON.stringify({
                error: {
                    message: "Provider returned error",
                    metadata: { raw: "auth failed for Bearer sk-or-v1-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
                },
            }),
            provider_name: "OpenRouter",
        });

        expect(error.message).not.toContain("sk-or-v1-aaaa");
        expect(error.message).toContain("[redacted]");
    });

    /**
     * The production 404: Alibaba's Token Plan host has no
     * `/images/generations`, answers with an empty body, and the bot reading
     * "HTTP 404" alone invented a model and a routing for it.
     */
    test("an empty 404 names the method, the address and the missing endpoint", () => {
        const url = "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/images/generations";
        const error = toHarnessError({ status: 404, provider_name: "Alibaba Cloud Token Plan", url });

        expect(error.message).toBe(
            `Alibaba Cloud Token Plan: HTTP 404 at POST ${url} - no endpoint at that address; check the provider's base URL`,
        );
        expect(error.url).toBe(url);
        expect(error.method).toBe("POST");
        expect(error.retryable).toBe(false);
    });

    test("a 404 with the provider's own reason keeps it and adds no guess", () => {
        const error = toHarnessError({
            status: 404,
            body: JSON.stringify({ error: { message: "model not found" } }),
            provider_name: "Example",
            url: "https://api.example.com/v1/images/generations",
        });

        expect(error.message).toBe(
            "Example: model not found at POST https://api.example.com/v1/images/generations",
        );
        expect(error.message).not.toContain("no endpoint");
    });

    test("an address the provider already names is not repeated", () => {
        const url = "https://api.example.com/v1/images/generations";
        const error = toHarnessError({
            status: 400,
            body: JSON.stringify({ error: { message: `POST ${url} is not supported` } }),
            provider_name: "Example",
            url,
        });

        expect(error.message.match(/images\/generations/g)?.length).toBe(1);
    });

    test("a prompt past the model's window is fatal, keeps the provider's limit and says what to set", () => {
        const error = toHarnessError({
            status: 400,
            body: JSON.stringify({
                error: { message: "This model's maximum context length is 65536 tokens. However, your messages resulted in 99812 tokens." },
            }),
            provider_name: "Nvidia Cloud",
        });

        expect(error.fatal).toBe(true);
        expect(error.retryable).toBe(false);
        expect(error.provider_wide).toBe(false);
        expect(error.message).toContain("maximum context length is 65536 tokens");
        expect(error.message).toContain("Set this model's context window under Settings > Models");
        expect(error.message).toContain("assumed to have 1,000,000");
    });

    test("any other 400 is only about the model, never fatal", () => {
        const error = toHarnessError({
            status: 400,
            body: JSON.stringify({ error: { message: "temperature is not supported" } }),
            provider_name: "Example",
        });

        expect(error.fatal).toBe(false);
        expect(error.message).not.toContain("Settings > Models");
    });
});
