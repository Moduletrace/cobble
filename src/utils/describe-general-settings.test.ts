import { describe, expect, test } from "bun:test";
import type { GeneralSettingsSectionValues } from "@/src/dict/general-settings-dict";
import describeGeneralSettings from "./describe-general-settings";

const run_limits: GeneralSettingsSectionValues = {
    key: "run-limits",
    title: "Run limits",
    href: "/admin/settings/general/run-limits",
    editor: "the super admin",
    editable_by: "super_admin",
    values: [
        { key: "task_steps", title: "Tool steps per task", label: "60 steps" },
        { key: "run_tokens", title: "Tokens per run", label: "250,000 tokens" },
    ],
};

const theme: GeneralSettingsSectionValues = {
    key: "theme",
    title: "Theme",
    href: "/admin/settings/general/theme",
    editor: "anyone",
    editable_by: "everyone",
    values: [{ key: "theme", title: "Theme", label: "dark" }],
};

describe("describeGeneralSettings", () => {
    test("names each group, who may change it, and each value with its ref", () => {
        const text = describeGeneralSettings({ sections: [run_limits, theme] });

        expect(text).toContain("## Run limits");
        expect(text).toContain("/admin/settings/general/run-limits - only the super admin can change it");
        expect(text).toContain("- Tokens per run: 250,000 tokens - [setting:run-limits:run_tokens]");
        expect(text).toContain("## Theme");
        expect(text).toContain("anyone can change it");
    });

    test("says so when there is nothing to read", () => {
        expect(describeGeneralSettings({ sections: [] })).toBe("No settings are readable.");
    });
});