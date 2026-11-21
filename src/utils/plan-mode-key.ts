type Params = {
    bot_id?: number | string | null;
    workspace_id?: number | string | null;
};

/**
 * The key Plan mode is stored under for one conversation: the bot and the
 * workspace it's in, so the bot's own chat and the same bot inside a
 * workspace are two different places. Zero stands in for "none".
 */
export default function planModeKey({ bot_id, workspace_id }: Params): string {
    return `${Number(bot_id) || 0}:${Number(workspace_id) || 0}`;
}