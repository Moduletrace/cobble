import BunSQLite from "@moduletrace/bun-sqlite";
import type { CronJobWithNames } from "@/src/types";
import botFaceSql from "@/src/utils/bot-face-sql";

type Params = {
    user_id: number | string;
    /**
     * Only this bot's.
     */
    bot_id?: number | string;
    /**
     * Only this one.
     */
    cron_job_id?: number | string;
};

/**
 * The user's schedules with their bot (its face as the user sees it) and
 * workspace names, the next to
 * run first and paused ones last.
 */
export default async function grabCronJobs({ user_id, bot_id, cron_job_id }: Params): Promise<CronJobWithNames[]> {
    const face = botFaceSql({ user_id, prefix: "bot_" });
    const where = [`c.user_id = ?`];
    const values: (number | string)[] = [user_id];

    if (bot_id) {
        where.push(`c.bot_id = ?`);
        values.push(bot_id);
    }

    if (cron_job_id) {
        where.push(`c.id = ?`);
        values.push(cron_job_id);
    }

    const res = await BunSQLite.sql<CronJobWithNames>({
        sql: `SELECT c.*, b.name AS bot_name, b.kind AS bot_kind, b.hue AS bot_hue, ${face.sql},
                b.image_media_id AS bot_image_media_id, w.name AS workspace_name
            FROM cron_jobs c
            JOIN bots b ON b.id = c.bot_id
            LEFT JOIN workspaces w ON w.id = c.workspace_id
            WHERE ${where.join(" AND ")}
            ORDER BY c.enabled DESC, c.next_run_at IS NULL, c.next_run_at ASC, c.id ASC`,
        values: [...face.values, ...values],
    });

    return res.payload || [];
}
