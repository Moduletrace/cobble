import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";

type Params = {
    bot_id: number | string;
    workspace_id: number | string;
};

/**
 * A workspace's task can only be had by a bot working there: a member
 * (`workspace_bots`) or the coordinator, which is in every workspace.
 */
export default async function assertBotWorksThere({ bot_id, workspace_id }: Params) {
    const res = await BunSQLite.sql<{ id: number }>({
        sql: `SELECT b.id FROM bots b
            WHERE b.id = ? AND (
                b.kind = 'coordinator'
                OR EXISTS (SELECT 1 FROM workspace_bots wb WHERE wb.bot_id = b.id AND wb.workspace_id = ?)
            )
            LIMIT 1`,
        values: [Number(bot_id), Number(workspace_id)],
    });

    if (!res.payload?.[0]?.id) {
        throw new AppError(`Bot ${bot_id} doesn't work in workspace ${workspace_id}, so it can't have a task there.`);
    }
}
