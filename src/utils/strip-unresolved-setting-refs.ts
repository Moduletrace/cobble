import { findGeneralSettingsField, findGeneralSettingsSection } from "@/src/dict/general-settings-dict";

/**
 * Fenced code blocks (closed or still open at the end) and inline code
 * spans, kept apart so a ref written inside example code stays as it was
 * typed.
 */
const CodeParts = /(```[\s\S]*?(?:```|$)|~~~[\s\S]*?(?:~~~|$)|`[^`\n]+`)/g;

/**
 * A code span holding nothing but one setting ref (`` `[setting:x:y]` ``):
 * that one is the ref, as it is in a message (`linkComputerRefs`).
 */
const LoneRefInCode = /^`{1,2}[ \t]*\[setting:[a-z0-9_:-]+\][ \t]*`{1,2}$/i;

const SettingRefs = /\[setting:([a-z0-9-]+)(?::([a-z0-9_-]+))?\]/gi;

/**
 * The refs in a piece of text that the app can't resolve: the section is no
 * page of the settings and, when named, the field is not in it.
 */
function unresolvedIn({ text }: { text: string }): string[] {
    const unresolved: string[] = [];

    for (const match of text.matchAll(SettingRefs)) {
        const ref = match[0];
        const section = match[1] || "";
        const field = match[2];
        const found = findGeneralSettingsSection({ key: section });
        const holds = found ? !field || Boolean(findGeneralSettingsField({ section, field })) : false;

        if (!holds && !unresolved.includes(ref)) unresolved.push(ref);
    }

    return unresolved;
}

/**
 * Removes the `[setting:...]` refs the app can't resolve: a ref that names
 * no page and field still renders, as a pill that goes nowhere. Taking it
 * out leaves the rest of the answer, where sending the whole answer back for
 * one pill costs a rewrite and, on the third fault, the answer itself
 * (`reviewBotReply`). A ref inside a code span is read like one in a
 * message: alone it is the ref, inside longer code it is literal text.
 */
export default function stripUnresolvedSettingRefs({ text }: { text: string }) {
    if (!text.toLowerCase().includes("[setting:")) return text;

    return text
        .split(CodeParts)
        .map((part, index) => {
            if (index % 2 == 1 && !LoneRefInCode.test(part)) return part;

            const unresolved = unresolvedIn({ text: part });

            return unresolved.reduce((kept, ref) => kept.split(ref).join(""), part);
        })
        .join("");
}