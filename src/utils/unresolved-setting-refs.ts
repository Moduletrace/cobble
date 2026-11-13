import { findGeneralSettingsField, findGeneralSettingsSection } from "@/src/dict/general-settings-dict";

/**
 * The `[setting:<section>:<field>]` refs in a reply that name no setting
 * the app has, once each. A ref the app can't resolve still renders, but
 * it links to a page and an anchor that aren't there, so it is sent back
 * to be written again with the ref `read_settings` gave.
 */
export default function unresolvedSettingRefs({ text }: { text: string }): string[] {
    const pattern = /\[setting:([a-z0-9-]+)(?::([a-z0-9_-]+))?\]/gi;
    const unresolved: string[] = [];

    for (const match of text.matchAll(pattern)) {
        const ref = match[0];
        const section = match[1];
        const field = match[2];
        const found = findGeneralSettingsSection({ key: section });
        const holds = found ? !field || Boolean(findGeneralSettingsField({ section: section, field })) : false;

        if (!holds && !unresolved.includes(ref)) unresolved.push(ref);
    }

    return unresolved;
}