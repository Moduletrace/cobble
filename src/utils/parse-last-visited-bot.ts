export type LastVisitedBot = {
    bot_id: number;
    /**
     * Null: the bot's own chat.
     */
    workspace_id: number | null;
};

type Params = {
    bot_id?: string | number | null;
    workspace_id?: string | number | null;
};

/**
 * The conversation the last-visited cookies name, or null when they don't
 * name one. Ids are checked to be positive whole numbers, so a hand-edited
 * cookie never reaches a query; whether the user still reaches that
 * conversation is the caller's check.
 */
export default function parseLastVisitedBot({ bot_id, workspace_id }: Params): LastVisitedBot | null {
    const bot = parseId(bot_id);

    if (bot == null) return null;

    if (workspace_id === undefined || workspace_id === null || workspace_id === "") {
        return { bot_id: bot, workspace_id: null };
    }

    const workspace = parseId(workspace_id);

    if (workspace == null) return null;

    return { bot_id: bot, workspace_id: workspace };
}

function parseId(value?: string | number | null): number | null {
    if (value === undefined || value === null) return null;

    const raw = String(value).trim();

    if (!/^\d+$/.test(raw)) return null;

    const id = Number(raw);

    return Number.isSafeInteger(id) && id > 0 ? id : null;
}
