import BunSQLite from "@moduletrace/bun-sqlite";
import type { TaskDetail } from "@/src/types";
import { OpenTaskStatuses } from "@/src/dict/task-dict";
import AppError from "@/src/utils/app-error";
import botFaceSql from "@/src/utils/bot-face-sql";
import taskScopesSql from "@/src/utils/task-access/task-scopes-sql";
import grabCrewRole from "../access/grab-crew-role";
import grabTaskMedia from "./grab-task-media";
import grabTaskNotes from "./grab-task-notes";
import grabTasks from "./grab-tasks";

type Params = {
    /**
     * The user asking: they must reach the task's bot or workspace.
     */
    user_id: number | string;
    task_id: number | string;
};

/**
 * One task with its notes (oldest first, each with the bot that wrote it),
 * its files, who added it and its subtasks when it is workspace-wide (each as a
 * list shows it, only the ones the user reaches), only if the user
 * reaches the bot or workspace it belongs to (`taskScopesSql`, the same
 * condition the lists use).
 */
export default async function grabTask({ user_id, task_id }: Params): Promise<TaskDetail> {
    const access = taskScopesSql({ role: await grabCrewRole({ user_id }), user_id });
    const face = botFaceSql({ user_id, alias: "b", prefix: "bot_" });

    const row_res = await BunSQLite.sql<TaskDetail>({
        sql: `SELECT t.*, b.name AS bot_name, b.kind AS bot_kind, b.hue AS bot_hue, b.color AS bot_color, b.stone AS bot_stone,
                b.image_media_id AS bot_image_media_id, ${face.sql}, w.name AS workspace_name, w.image_media_id AS workspace_image_media_id,
                p.title AS parent_title, p.status AS parent_status,
                (SELECT COUNT(*) FROM tasks st WHERE st.parent_task_id = t.id) AS subtask_count,
                (SELECT COUNT(*) FROM tasks st WHERE st.parent_task_id = t.id AND st.status IN (${OpenTaskStatuses.map(() => "?").join(", ")})) AS subtask_open_count,
                cb.name AS created_by_bot_name,
                NULLIF(TRIM(COALESCE(cu.first_name, '') || ' ' || COALESCE(cu.last_name, '')), '') AS created_by_user_name
            FROM tasks t
            LEFT JOIN bots b ON b.id = t.bot_id
            LEFT JOIN workspaces w ON w.id = t.workspace_id
            LEFT JOIN tasks p ON p.id = t.parent_task_id
            LEFT JOIN bots cb ON cb.id = t.created_by_bot_id
            LEFT JOIN users cu ON cu.id = t.created_by_user_id
            WHERE t.id = ? AND ${access.sql}
            LIMIT 1`,
        values: [...face.values, ...OpenTaskStatuses, Number(task_id), ...access.values],
    });

    const row = row_res.payload?.[0];

    if (!row) {
        throw new AppError(`Task not found.`);
    }

    const [notes, files, subtasks] = await Promise.all([
        grabTaskNotes({ task_id }),
        grabTaskMedia({ task_id }),
        grabTasks({ user_id, only_parent_task_id: Number(task_id) }),
    ]);

    return { ...row, notes, files, subtasks };
}
