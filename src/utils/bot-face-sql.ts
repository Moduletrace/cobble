import type { SqlCondition } from "./crew-access/types";

type Params = {
    user_id: number | string;
    /**
     * The bots table alias.
     */
    alias?: string;
    /**
     * Put before the column names, e.g. `bot_` for `bot_face`.
     */
    prefix?: string;
};

/**
 * Select columns for a bot's face and status line as one user sees them
 * (`bot_user_faces`): idle and no status line when the bot has none for
 * them. Faces are per user, so a job one user's waiting on never shows
 * on anyone else's screen.
 */
export default function botFaceSql({ user_id, alias = "b", prefix = "" }: Params): SqlCondition {
    const column = (name: string) =>
        `(SELECT f.${name} FROM bot_user_faces f WHERE f.bot_id = ${alias}.id AND f.user_id = ?)`;

    return {
        sql: `COALESCE(${column("face")}, 'idle') AS ${prefix}face, COALESCE(${column("status_line")}, '') AS ${prefix}status_line`,
        values: [Number(user_id), Number(user_id)],
    };
}
