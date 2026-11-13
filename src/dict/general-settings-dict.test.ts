import { describe, expect, test } from "bun:test";
import generalSettingsHref, {
    CitableGeneralSettingsSections,
    GeneralSettingsRoot,
    GeneralSettingsSections,
    findCitableGeneralSettingsSection,
    findGeneralSettingsField,
    findGeneralSettingsSection,
} from "./general-settings-dict";

describe("GeneralSettingsSections", () => {
    test("every group has a key of its own and a page under General", () => {
        const keys = GeneralSettingsSections.map((section) => section.key);

        expect(new Set(keys).size).toBe(keys.length);

        for (const key of keys) {
            expect(generalSettingsHref({ section: key })).toBe(`${GeneralSettingsRoot}/${key}`);
        }
    });

    test("a field's href is its section's page, then its anchor", () => {
        expect(generalSettingsHref({ section: "run-limits", field: "reply_steps" })).toBe(
            "/admin/settings/general/run-limits#reply_steps",
        );
        expect(generalSettingsHref({ section: null })).toBe(GeneralSettingsRoot);
    });

    test("a citable group names the fields a bot may send someone to", () => {
        expect(CitableGeneralSettingsSections.length).toBeGreaterThan(0);

        for (const section of CitableGeneralSettingsSections) {
            const field = section.fields[0];

            expect(section.fields.length).toBeGreaterThan(0);
            expect(findGeneralSettingsField({ section: section.key, field: field?.key })).toEqual(field || null);
        }
    });

    test("what a bot may cite is looked up, and a typo finds nothing", () => {
        expect(findCitableGeneralSettingsSection({ key: "run-limits" })?.title).toBe("Run limits");
        expect(findCitableGeneralSettingsSection({ key: "theme" })).toBeNull();
        expect(findGeneralSettingsSection({ key: "nope" })).toBeNull();
        expect(findGeneralSettingsField({ section: "run-limits", field: "nope" })).toBeNull();
        expect(findGeneralSettingsField({ section: "theme", field: "reply_steps" })).toBeNull();
    });
});