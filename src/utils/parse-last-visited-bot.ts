import parsePositiveId from "./parse-positive-id";

export type LastVisitedBot = {
    bot_id: number;
    /**
     * The workspace the conversation was in; null for the bot's own chat.
     */
    workspace_id: number | null;
};

type Params = {
    /**
     * The cookie's value: `<bot_id>`, or `<bot_id>:<workspace_id>` for a
     * conversation inside a workspace.
     */
    value?: string | number | null;
};

/**
 * The conversation the last-visited cookie names, or null when it doesn't
 * name one. Ids are checked to be positive whole numbers, so a hand-edited
 * cookie never reaches a query; a bad workspace part drops only the
 * workspace. Whether the user still reaches that conversation is the
 * caller's check.
 */
export default function parseLastVisitedBot({ value }: Params): LastVisitedBot | null {
    if (value === undefined || value === null) return null;

    const [bot_part, workspace_part, ...rest] = String(value).split(":");
    const bot_id = parsePositiveId({ value: bot_part });

    if (bot_id == null || rest.length) return null;

    return {
        bot_id,
        workspace_id: parsePositiveId({ value: workspace_part }),
    };
}
