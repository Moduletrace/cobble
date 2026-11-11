import { describe, expect, test } from "bun:test";
import harnessDefaultName from "./harness-default-name";

describe("harnessDefaultName", () => {
    test("returns 'turned off' when default is disabled", () => {
        expect(
            harnessDefaultName({
                harness_default: { enabled: false },
            }),
        ).toBe("turned off");
    });

    test("returns model and provider name when current model exists", () => {
        expect(
            harnessDefaultName({
                harness_default: {
                    enabled: true,
                    current: {
                        name: "Claude 3.5 Sonnet",
                        provider_name: "Anthropic",
                    } as any,
                },
            }),
        ).toBe("Claude 3.5 Sonnet on Anthropic");
    });

    test("returns fallback title in lower case when no current model", () => {
        expect(
            harnessDefaultName({
                falls_back_title: "Text",
            }),
        ).toBe("same as text");
    });

    test("returns 'not available' when nothing is specified", () => {
        expect(harnessDefaultName({})).toBe("not available");
    });
});
