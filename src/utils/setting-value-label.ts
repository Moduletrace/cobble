import type { GeneralSettingsFieldKind } from "@/src/dict/general-settings-dict";

type Params = {
    kind: GeneralSettingsFieldKind;
    /**
     * The saved number, or text for a `text` field. `null` and `undefined`
     * mean the setting was never saved, so the code's default applies.
     */
    value?: number | string | null;
};

const Units: Record<Exclude<GeneralSettingsFieldKind, "text">, { one: string; many: string }> = {
    steps: { one: "step", many: "steps" },
    tokens: { one: "token", many: "tokens" },
    characters: { one: "character", many: "characters" },
    mb: { one: "MB", many: "MB" },
    days: { one: "day", many: "days" },
    seconds: { one: "second", many: "seconds" },
};

/**
 * A setting's value the way a person reads it in the form ("20 steps",
 * "500 MB"), so a bot quoting it in a message says what the input says.
 */
export default function settingValueLabel({ kind, value }: Params): string {
    if (value === null || value === undefined || value === "") return "not set yet";

    if (kind == "text") return String(value);

    const number = Number(value);

    if (!Number.isFinite(number)) return "not set yet";

    const unit = Units[kind];

    return `${number.toLocaleString("en-US")} ${number == 1 ? unit.one : unit.many}`;
}