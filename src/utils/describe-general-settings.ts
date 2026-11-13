import type { GeneralSettingsSectionValues } from "@/src/dict/general-settings-dict";
import generalSettingsRef from "./general-settings-ref";

/**
 * The General settings a bot may quote, as one block for its prompt: each
 * group with who may change it, each value as the form shows it, and the
 * ref that points a reader at it. Values are live, so a limit raised after
 * a run started reads right when the bot reports what stopped it.
 */
export default function describeGeneralSettings({ sections }: { sections: GeneralSettingsSectionValues[] }) {
    if (!sections.length) return "No settings are readable.";

    return [
        "# Settings > General, as they are now",
        "Each value ends with the ref to write when you name that setting: it shows as a pill that opens the page and the field. Say the value yourself, since the pill only takes the reader there.",
        ...sections.map((section) =>
            [
                `## ${section.title}`,
                `${section.href} - ${section.editor == "anyone" ? "anyone can change it" : `only ${section.editor} can change it`}`,
                ...section.values.map(
                    (value) =>
                        `- ${value.title}: ${value.label} - ${generalSettingsRef({ section: section.key, field: value.key })}`,
                ),
            ].join("\n"),
        ),
    ].join("\n\n");
}