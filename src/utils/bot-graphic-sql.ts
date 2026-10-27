import type { SqlCondition } from "./crew-access/types";

type Params = {
    /**
     * The graphics table's alias in the query.
     */
    alias?: string;
    user_id: number | string;
};

/**
 * The graphics a user sees: only those a bot made for them, like the
 * conversation they were made in. Nobody else, crew managers included,
 * reads another user's graphic.
 */
export function viewerGraphicsSql({ alias = "g", user_id }: Params): SqlCondition {
    return { sql: `${alias}.user_id = ?`, values: [Number(user_id)] };
}

/**
 * The graphics a run edits: those its bot made for its user.
 */
export function runGraphicsSql({ alias = "g", user_id, bot_id }: Params & { bot_id: number | string }): SqlCondition {
    return { sql: `${alias}.user_id = ? AND ${alias}.bot_id = ?`, values: [Number(user_id), Number(bot_id)] };
}
