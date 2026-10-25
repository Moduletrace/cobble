import { describe, expect, test } from "bun:test";
import describeCallSettings from "./describe-call-settings";

describe("describeCallSettings", () => {
    test("names every setting by its title", () => {
        expect(
            describeCallSettings({
                harness: "text",
                settings: {
                    model_source: "pinned",
                    settings_source: "workspace",
                    params: { temperature: 0.3, reasoning_effort: "high" },
                    max_tokens: 4000,
                    fell_back_from: ["2:openai/gpt-x"],
                },
            }),
        ).toEqual([
            { label: "Model pick", value: "Picked in the settings" },
            { label: "Settings from", value: "The workspace's" },
            { label: "Temperature", value: "0.3" },
            { label: "Reasoning effort", value: "High" },
            { label: "Max tokens", value: "4,000" },
            { label: "Fell back from", value: "openai/gpt-x" },
        ]);
    });

    test("says when nothing was sent", () => {
        expect(describeCallSettings({ harness: "text", settings: { model_source: "auto" } })).toEqual([
            { label: "Model pick", value: "Automatic" },
            { label: "Generation", value: "The provider's defaults" },
        ]);
    });

    test("leaves generation out where it doesn't apply", () => {
        expect(describeCallSettings({ harness: "speech", settings: { model_source: "pinned", voice: "alloy" } })).toEqual([
            { label: "Model pick", value: "Picked in the settings" },
            { label: "Voice", value: "alloy" },
        ]);
    });
});
