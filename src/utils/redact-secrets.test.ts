import { describe, expect, test } from "bun:test";
import redactSecrets from "./redact-secrets";

describe("redactSecrets", () => {
    test("replaces every occurrence with the key", () => {
        expect(
            redactSecrets({
                text: "token=ghp_abc123 and again ghp_abc123",
                secrets: [{ key: "GITHUB_TOKEN", value: "ghp_abc123" }],
            }),
        ).toBe("token=[GITHUB_TOKEN] and again [GITHUB_TOKEN]");
    });

    test("replaces longer values first", () => {
        expect(
            redactSecrets({
                text: "secret-long",
                secrets: [
                    { key: "SHORT", value: "secret" },
                    { key: "LONG", value: "secret-long" },
                ],
            }),
        ).toBe("[LONG]");
    });

    test("leaves very short values alone", () => {
        expect(
            redactSecrets({ text: "a 1 b", secrets: [{ key: "PIN", value: "1" }] }),
        ).toBe("a 1 b");
    });
});
