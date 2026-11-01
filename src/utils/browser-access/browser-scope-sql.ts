import type { SqlCondition } from "../crew-access/types";

type Params = {
    /**
     * The alias of `browser_access`.
     */
    alias: string;
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
};

/**
 * The `browser_access` rows that apply to a run: only its own user's, for
 * all their bots, for this bot, or for the workspace it's in. Never a row
 * for another place or another user.
 */
export default function browserScopeSql({ alias, user_id, bot_id, workspace_id }: Params): SqlCondition {
    return {
        sql: `${alias}.user_id = ? AND (
            (${alias}.bot_id IS NULL AND ${alias}.workspace_id IS NULL)
            OR (${alias}.bot_id = ? AND ${alias}.workspace_id IS NULL)
            OR (${alias}.bot_id IS NULL AND ${alias}.workspace_id = ?)
        )`,
        values: [Number(user_id), Number(bot_id), workspace_id ? Number(workspace_id) : -1],
    };
}
