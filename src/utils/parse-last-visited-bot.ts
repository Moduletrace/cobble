import parsePositiveId from "./parse-positive-id";

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
    const bot = parsePositiveId({ value: bot_id });

    if (bot == null) return null;

    return { bot_id: bot };
}
