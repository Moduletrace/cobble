export type LastVisitedBot = {
    bot_id: number;
};

type Params = {
    bot_id?: string | number | null;
};

/**
 * The bot the last-visited cookie names, or null when it doesn't name one.
 * The id is checked to be a positive whole number, so a hand-edited cookie
 * never reaches a query; whether the user still reaches that bot's own chat
 * is the caller's check.
 */
export default function parseLastVisitedBot({ bot_id }: Params): LastVisitedBot | null {
    const bot = parseId(bot_id);

    if (bot == null) return null;

    return { bot_id: bot };
}

function parseId(value?: string | number | null): number | null {
    if (value === undefined || value === null) return null;

    const raw = String(value).trim();

    if (!/^\d+$/.test(raw)) return null;

    const id = Number(raw);

    return Number.isSafeInteger(id) && id > 0 ? id : null;
}
