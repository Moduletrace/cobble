/**
 * A ref to a setting (`[setting:run-limits:reply_steps]`), which the chat
 * renders as a pill linking to that section of Settings > General, with
 * the field's anchor when one is named. A bot writes it when a limit
 * stopped it, so the reader can go straight to the value to change.
 */
export const GeneralSettingsRefHrefPrefix = "#setting-";

/**
 * The ref a bot writes for a setting. The field is optional: a section
 * alone opens its page.
 */
export default function generalSettingsRef({ section, field }: { section: string; field?: string | null }) {
    return `[setting:${section}${field ? `:${field}` : ""}]`;
}

/**
 * The section and field an `href` points at, or null when it isn't a
 * setting ref. Which sections and fields exist is checked by the caller
 * (`findGeneralSettingsField`), so a bot's typo stays a plain link.
 */
export function generalSettingsRefId({ href }: { href?: string | null }) {
    if (!href?.startsWith(GeneralSettingsRefHrefPrefix)) return null;

    const [section, field] = href.slice(GeneralSettingsRefHrefPrefix.length).split(":");

    if (!section) return null;

    return { section, field: field || null };
}