import { describe, expect, test } from "bun:test";
import generalSettingsRef, { generalSettingsRefId } from "./general-settings-ref";

describe("generalSettingsRef", () => {
    test("a field ref names the section and the field", () => {
        expect(generalSettingsRef({ section: "run-limits", field: "reply_steps" })).toBe("[setting:run-limits:reply_steps]");
    });

    test("a section ref alone opens its page", () => {
        expect(generalSettingsRef({ section: "storage" })).toBe("[setting:storage]");
        expect(generalSettingsRef({ section: "storage", field: "" })).toBe("[setting:storage]");
    });
});

describe("generalSettingsRefId", () => {
    test("reads the section and field back", () => {
        expect(generalSettingsRefId({ href: "#setting-run-limits:reply_steps" })).toEqual({
            section: "run-limits",
            field: "reply_steps",
        });
        expect(generalSettingsRefId({ href: "#setting-storage" })).toEqual({ section: "storage", field: null });
    });

    test("anything else is not a setting ref", () => {
        expect(generalSettingsRefId({ href: "#bot-3" })).toBeNull();
        expect(generalSettingsRefId({ href: "#setting-" })).toBeNull();
        expect(generalSettingsRefId({ href: null })).toBeNull();
        expect(generalSettingsRefId({})).toBeNull();
    });
});