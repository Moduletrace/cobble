import { describe, expect, test } from "bun:test";
import redactProviderError from "./redact-provider-error";

describe("redactProviderError", () => {
    test("masks prefixed keys", () => {
        expect(redactProviderError({ text: "key sk-proj-abc123def456 is bad" })).toBe("key [redacted] is bad");
        expect(redactProviderError({ text: "sk-or-v1-aaaaaaaaaaaaaaaaaaaa rejected" })).toBe("[redacted] rejected");
        expect(redactProviderError({ text: "key-abcdef0123456789abcdef invalid" })).toBe("[redacted] invalid");
    });

    test("masks a Bearer token but keeps the scheme", () => {
        expect(redactProviderError({ text: "Authorization: Bearer abcdef0123456789" })).toBe(
            "Authorization: Bearer [redacted]",
        );
    });

    test("masks a key-like JSON field's value", () => {
        expect(redactProviderError({ text: '{"api_key": "shortkey", "model": "gpt"}' })).toBe(
            '{"api_key": "[redacted]", "model": "gpt"}',
        );
        expect(redactProviderError({ text: '{"authorization": "Bearer x"}' })).toContain("[redacted]");
    });

    test("masks a bare long token echoed without a prefix", () => {
        const key = "a".repeat(48);
        expect(redactProviderError({ text: `auth failed for ${key}` })).toBe("auth failed for [redacted]");
    });

    test("leaves ordinary error text and short words alone", () => {
        expect(redactProviderError({ text: "Rate limit exceeded: free-models-per-day" })).toBe(
            "Rate limit exceeded: free-models-per-day",
        );
        expect(redactProviderError({ text: "tools are not supported" })).toBe("tools are not supported");
        expect(redactProviderError({ text: "The model returned no answer." })).toBe("The model returned no answer.");
    });
});
