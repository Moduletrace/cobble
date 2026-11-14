import BunSQLite from "@moduletrace/bun-sqlite";
import deleteAskRows from "./delete-ask-rows";

type Params = {
    /**
     * One place's requests, or one user's when `user_id` is given.
     */
    workspace_id?: number | string | null;
    user_id?: number | string | null;
};

/**
 * Deletes asks with everything their runs left behind, for a workspace or a
 * user that is going away (foreign keys are off outside the server process).
 */
export default async function deleteAsks({ workspace_id, user_id }: Params) {
    const res = await BunSQLite.sql<{ id: number }>({
        sql: `SELECT id FROM bot_asks WHERE ${user_id ? "user_id" : "workspace_id"} = ?`,
        values: [user_id ? Number(user_id) : Number(workspace_id)],
    });

    const ids = (res.payload || []).map((ask) => Number(ask.id));

    for (let index = 0; index < ids.length; index += 100) {
        await deleteAskRows({ asks: ids.slice(index, index + 100).map((id) => ({ id })) });
    }

    return ids.length;
}
