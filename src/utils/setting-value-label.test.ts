import { describe, expect, test } from "bun:test";
import settingValueLabel from "./setting-value-label";

describe("settingValueLabel", () => {
    test("counts read with their unit, singular and plural", () => {
        expect(settingValueLabel({ kind: "steps", value: 20 })).toBe("20 steps");
        expect(settingValueLabel({ kind: "steps", value: 1 })).toBe("1 step");
        expect(settingValueLabel({ kind: "characters", value: 4000 })).toBe("4,000 characters");
        expect(settingValueLabel({ kind: "characters", value: 1 })).toBe("1 character");
        expect(settingValueLabel({ kind: "tokens", value: 250000 })).toBe("250,000 tokens");
        expect(settingValueLabel({ kind: "days", value: 1 })).toBe("1 day");
        expect(settingValueLabel({ kind: "seconds", value: 60 })).toBe("60 seconds");
    });

    test("megabytes never pluralise the unit", () => {
        expect(settingValueLabel({ kind: "mb", value: 500 })).toBe("500 MB");
        expect(settingValueLabel({ kind: "mb", value: 1 })).toBe("1 MB");
    });

    test("text is kept as written", () => {
        expect(settingValueLabel({ kind: "text", value: "Cobble HQ" })).toBe("Cobble HQ");
    });

    test("a limit turned off reads as unlimited, not as unset", () => {
        expect(settingValueLabel({ kind: "steps", value: "unlimited" })).toBe("unlimited");
        expect(settingValueLabel({ kind: "tokens", value: "unlimited" })).toBe("unlimited");
        expect(settingValueLabel({ kind: "seconds", value: "unlimited" })).toBe("unlimited");
    });

    test("an unset or unreadable value says so instead of showing a number", () => {
        expect(settingValueLabel({ kind: "steps", value: null })).toBe("not set yet");
        expect(settingValueLabel({ kind: "tokens", value: undefined })).toBe("not set yet");
        expect(settingValueLabel({ kind: "text", value: "" })).toBe("not set yet");
        expect(settingValueLabel({ kind: "steps", value: "abc" })).toBe("not set yet");
    });
});