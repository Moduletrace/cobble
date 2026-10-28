type Params = {
    value?: string | number | null;
};

/**
 * A positive whole number from a cookie or query value, or null when it
 * isn't one, so a hand-edited value never reaches a query. Surrounding
 * whitespace is trimmed.
 */
export default function parsePositiveId({ value }: Params): number | null {
    if (value === undefined || value === null) return null;

    const raw = String(value).trim();

    if (!/^\d+$/.test(raw)) return null;

    const id = Number(raw);

    return Number.isSafeInteger(id) && id > 0 ? id : null;
}
