import { describe, expect, test } from "bun:test";
import stripUnresolvedSettingRefs from "./strip-unresolved-setting-refs";

describe("stripUnresolvedSettingRefs", () => {
    test("keeps a ref the app resolves", () => {
        expect(stripUnresolvedSettingRefs({ text: "See [setting:run-limits:run_tokens]." })).toBe(
            "See [setting:run-limits:run_tokens].",
        );
    });

    test("keeps a ref to a whole page", () => {
        expect(stripUnresolvedSettingRefs({ text: "In [setting:prompt-appendix]." })).toBe(
            "In [setting:prompt-appendix].",
        );
    });

    test("takes out a page that isn't there", () => {
        expect(stripUnresolvedSettingRefs({ text: "Set [setting:general:run_tokens] higher." })).toBe(
            "Set  higher.",
        );
    });

    test("takes out a field the page doesn't have", () => {
        expect(stripUnresolvedSettingRefs({ text: "Change [setting:run-limits:nonsense]." })).toBe("Change .");
    });

    test("a ref quoted alone in a code span is still the ref", () => {
        expect(stripUnresolvedSettingRefs({ text: "Write `[setting:general:x]` there." })).toBe("Write `` there.");
        expect(stripUnresolvedSettingRefs({ text: "Write `[setting:run-limits:run_tokens]` there." })).toBe(
            "Write `[setting:run-limits:run_tokens]` there.",
        );
    });

    test("a ref inside example code is left as typed", () => {
        const text = "The shape is `[setting:<page>:<field>]`, like [setting:run-limits:reply_steps].";

        expect(stripUnresolvedSettingRefs({ text })).toBe(text);
    });

    test("a fenced block is left alone", () => {
        const text = "```\n[setting:general:run_tokens]\n```";

        expect(stripUnresolvedSettingRefs({ text })).toBe(text);
    });

    test("text with no ref at all comes back as it was", () => {
        expect(stripUnresolvedSettingRefs({ text: "Nothing to see." })).toBe("Nothing to see.");
    });
});