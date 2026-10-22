import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_TASK_NOTES } from "@/db/types/db";
import type { TaskDetail } from "@/src/types";
import AppError from "@/src/utils/app-error";
import botFaceSql from "@/src/utils/bot-face-sql";
import taskScopesSql from "@/src/utils/task-access/task-scopes-sql";
import grabCrewRole from "../access/grab-crew-role";
import grabTaskMedia from "./grab-task-media";

type Params = {
    /**
     * The user asking: they must reach the task's bot or workspace.
     */
    user_id: number | string;
    task_id: number | string;
};

/**
 * One task with its notes (oldest first) and files, only if the user
 * reaches the bot or workspace it belongs to (`taskScopesSql`, the same
 * condition the lists use).
 */
export default async function grabTask({ user_id, task_id }: Params): Promise<TaskDetail> {
    const access = taskScopesSql({ role: await grabCrewRole({ user_id }), user_id });
    const face = botFaceSql({ user_id, alias: "b", prefix: "bot_" });

    const row_res = await BunSQLite.sql<TaskDetail>({
        sql: `SELECT t.*, b.name AS bot_name, b.kind AS bot_kind, b.hue AS bot_hue, b.color AS bot_color, b.stone AS bot_stone,
                b.image_media_id AS bot_image_media_id, ${face.sql}, w.name AS workspace_name
            FROM tasks t
            LEFT JOIN bots b ON b.id = t.bot_id
            LEFT JOIN workspaces w ON w.id = t.workspace_id
            WHERE t.id = ? AND ${access.sql}
            LIMIT 1`,
        values: [...face.values, Number(task_id), ...access.values],
    });

    const row = row_res.payload?.[0];

    if (!row) {
        throw new AppError(`Task not found.`);
    }

    const [notes_res, files] = await Promise.all([
        BunSQLite.sql<BUN_SQLITE_COBBLE_TASK_NOTES>({
            sql: `SELECT * FROM task_notes WHERE task_id = ? ORDER BY id ASC`,
            values: [Number(task_id)],
        }),
        grabTaskMedia({ task_id }),
    ]);

    return { ...row, notes: notes_res.payload || [], files };
}
