import type { DatabaseSearchMode } from "@/src/types";

export type DatabaseSearchModeOption = {
    value: DatabaseSearchMode;
    title: string;
};

/**
 * How a search matches, in the order the picker offers them: every word is
 * the useful default (it finds a message by two words it holds wherever
 * they sit), the phrase is for a run of words that has to stay together.
 */
export const DatabaseSearchModes: DatabaseSearchModeOption[] = [
    { value: "every_word", title: "Every word" },
    { value: "phrase", title: "The phrase" },
];

/**
 * A mode read from the address, or the default when it isn't one of them.
 */
export function parseDatabaseSearchMode({ value }: { value?: string | null }): DatabaseSearchMode {
    const mode = DatabaseSearchModes.find((option) => option.value == value);

    return mode?.value || "every_word";
}
