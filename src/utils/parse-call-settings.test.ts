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

    test("is null for an older call or a broken value", () => {
        expect(parseCallSettings({ json: null })).toBeNull();
        expect(parseCallSettings({ json: "{nope" })).toBeNull();
        expect(parseCallSettings({ json: "3" })).toBeNull();
    });
});
