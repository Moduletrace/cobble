import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_TASK_MEDIA } from "@/db/types/db";

type Params = {
    /**
     * A bot's own tasks, or a workspace's.
     */
    bot_id?: number | string | null;
    workspace_id?: number | string | null;
};

/**
 * The bytes a bot's or workspace's tasks filed that no folder owns (a chat
 * upload linked to a task). Read before the bot or workspace is deleted:
 * the tasks and their links cascade, and nothing else would ever clean
 * those files up. A bot file is left alone: its folder is its home.
 */
export async function grabTaskMediaIds({ bot_id, workspace_id }: Params): Promise<number[]> {
    const column = workspace_id ? "workspace_id" : "bot_id";
    const owner = workspace_id || bot_id;

    if (!owner) return [];

    const links = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_TASK_MEDIA>({
            sql: `SELECT tm.media_id FROM task_media tm
                JOIN tasks t ON t.id = tm.task_id
                WHERE t.${column} = ? AND tm.bot_file_id IS NULL`,
            values: [Number(owner)],
        })
    ).payload || [];

    return links.map((link) => Number(link.media_id)).filter(Boolean);
}
