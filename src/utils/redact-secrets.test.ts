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

    test("masks a three character code", () => {
        expect(
            redactSecrets({
                text: "code 429 ping, again 429",
                secrets: [{ key: "CODE", value: "429" }],
            }),
        ).toBe("code [CODE] ping, again [CODE]");
    });

    test("leaves a two character value alone", () => {
        expect(
            redactSecrets({ text: "ab cd", secrets: [{ key: "PAIR", value: "cd" }] }),
        ).toBe("ab cd");
    });

    test("masks a secret printed as base64 or hex (L6)", () => {
        const value = "hunter2";
        const base64 = Buffer.from(value, "utf8").toString("base64");
        const hex = Buffer.from(value, "utf8").toString("hex");

        expect(
            redactSecrets({ text: `blob ${base64} end`, secrets: [{ key: "PASS", value }] }),
        ).toBe("blob [PASS] end");
        expect(
            redactSecrets({ text: `digest ${hex} end`, secrets: [{ key: "PASS", value }] }),
        ).toBe("digest [PASS] end");
    });

    test("masks a secret printed URL-encoded (L6)", () => {
        const value = "p@ss word";
        const encoded = encodeURIComponent(value);

        expect(
            redactSecrets({ text: `query ${encoded} end`, secrets: [{ key: "PASS", value }] }),
        ).toBe("query [PASS] end");
    });

    test("masks a long secret a run folded to lower case (L6)", () => {
        expect(
            redactSecrets({
                text: "logged supersecret123 here",
                secrets: [{ key: "KEY", value: "SuperSecret123" }],
            }),
        ).toBe("logged [KEY] here");
    });
});
