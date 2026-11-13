import { describe, expect, test } from "bun:test";
import parseCallSettings from "./parse-call-settings";

describe("parseCallSettings", () => {
    test("reads what was stored", () => {
        expect(
            parseCallSettings({
                json: JSON.stringify({
                    model_source: "pinned",
                    settings_source: "bot",
                    params: { temperature: 0.3, reasoning_effort: "high", bad: { x: 1 } },
                    max_tokens: 800,
                    fell_back_from: ["2:a/b", 3],
                }),
            }),
        ).toEqual({
            model_source: "pinned",
            settings_source: "bot",
            params: { temperature: 0.3, reasoning_effort: "high" },
            max_tokens: 800,
            fell_back_from: ["2:a/b"],
        });
    });

    test("keeps the run limits a call recorded, and nothing an older call lacks", () => {
        const kept = parseCallSettings({
            json: JSON.stringify({ model_source: "auto", limits: { steps: 20, run_tokens: null, context_tokens: 90_000, extra: 3 } }),
        });

        expect(kept?.limits).toEqual({ steps: 20, run_tokens: null, context_tokens: 90_000 });
        expect(
            parseCallSettings({ json: JSON.stringify({ model_source: "auto", limits: "lots" }) })?.limits,
        ).toBeUndefined();
    });

    test("keeps an unlimited run limit, rather than losing it as unreadable", () => {
        const kept = parseCallSettings({
            json: JSON.stringify({
                model_source: "auto",
                limits: { steps: "unlimited", run_tokens: 250_000, context_tokens: "unlimited" },
            }),
        });

        expect(kept?.limits).toEqual({ steps: "unlimited", run_tokens: 250_000, context_tokens: "unlimited" });
        expect(
            parseCallSettings({ json: JSON.stringify({ model_source: "auto", limits: { steps: "lots" } }) })?.limits,
        ).toEqual({ steps: null, run_tokens: null, context_tokens: null });
    });

    test("is null for an older call or a broken value", () => {
        expect(parseCallSettings({ json: null })).toBeNull();
        expect(parseCallSettings({ json: "{nope" })).toBeNull();
        expect(parseCallSettings({ json: "3" })).toBeNull();
    });
});
