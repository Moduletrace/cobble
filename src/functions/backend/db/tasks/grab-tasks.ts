import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_TASKS } from "@/db/types/db";
import { OpenTaskStatuses } from "@/src/dict/task-dict";
import type { TaskWithNames } from "@/src/types";
import botFaceSql from "@/src/utils/bot-face-sql";
import botTaskScopesSql from "@/src/utils/task-access/bot-task-scopes-sql";
import taskScopesSql from "@/src/utils/task-access/task-scopes-sql";
import type { SqlCondition } from "@/src/utils/task-access/types";
import grabCrewRole from "../access/grab-crew-role";

type Params = {
    /**
     * A user's own view (`taskScopesSql`): their bots and workspaces.
     */
    user_id?: number | string;
    /**
     * Or a bot run's view (`botTaskScopesSql`): its own and its
     * workspaces', or every task for the coordinator.
     */
    bot_id?: number | string;
    is_coordinator?: boolean;
    /**
     * Only one collection.
     */
    only_bot_id?: number | string | null;
    only_workspace_id?: number | string | null;
    /**
     * Only these statuses; none for every one.
     */
    statuses?: string[];
    /**
     * Only the open ones (todo, doing, blocked).
     */
    open_only?: boolean;
    limit?: number;
};

/**
 * Tasks with what a list shows beside them: the bot (its face as this user
 * sees it), the workspace and the newest note. Open ones first, blocked
 * before doing before to do, then the oldest.
 */
export default async function grabTasks({
    user_id,
    bot_id,
    is_coordinator,
    only_bot_id,
    only_workspace_id,
    statuses,
    open_only,
    limit,
}: Params): Promise<TaskWithNames[]> {
    const where: string[] = [];
    const values: (string | number)[] = [];

    if (user_id != null) {
        const access = taskScopesSql({ role: await grabCrewRole({ user_id }), user_id });
        where.push(access.sql);
        values.push(...access.values);
    } else if (bot_id != null) {
        const access = botTaskScopesSql({ bot_id, is_coordinator: Boolean(is_coordinator) });
        where.push(access.sql);
        values.push(...access.values);
    }

    if (only_bot_id) {
        where.push(`t.bot_id = ?`);
        values.push(Number(only_bot_id));
    }

    if (only_workspace_id) {
        where.push(`t.workspace_id = ?`);
        values.push(Number(only_workspace_id));
    }

    const wanted = open_only ? [...OpenTaskStatuses] : statuses?.length ? statuses : null;

    if (wanted) {
        where.push(`t.status IN (${wanted.map(() => "?").join(", ")})`);
        values.push(...wanted);
    }

    const face = botFaceSql({ user_id: user_id || 0, alias: "b", prefix: "bot_" });

    const res = await BunSQLite.sql<TaskWithNames>({
        sql: `SELECT t.*, b.name AS bot_name, b.kind AS bot_kind, b.hue AS bot_hue, b.color AS bot_color, b.stone AS bot_stone,
                b.image_media_id AS bot_image_media_id, ${face.sql}, w.name AS workspace_name,
                (SELECT n.text FROM task_notes n WHERE n.task_id = t.id ORDER BY n.id DESC LIMIT 1) AS latest_note,
                (SELECT COUNT(*) FROM task_media tm WHERE tm.task_id = t.id) AS media_count
            FROM tasks t
            LEFT JOIN bots b ON b.id = t.bot_id
            LEFT JOIN workspaces w ON w.id = t.workspace_id
            ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
            ORDER BY CASE t.status WHEN 'blocked' THEN 0 WHEN 'doing' THEN 1 WHEN 'todo' THEN 2 WHEN 'done' THEN 3 ELSE 4 END,
                t.updated_at DESC, t.id DESC
            ${limit ? `LIMIT ${Number(limit)}` : ""}`,
        values: [...face.values, ...values],
    });

    return res.payload || [];
}
