import type {
    BUN_SQLITE_COBBLE_BOT_SESSIONS,
    BUN_SQLITE_COBBLE_CRON_JOBS,
} from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import { grabBotSessionMaxMessages } from "../app-settings/grab-bot-session-max-messages";
import createBotSession from "./create-bot-session";
import rollOverLinkedSession from "./roll-over-linked-session";

type Params = {
    cron_job: BUN_SQLITE_COBBLE_CRON_JOBS;
};

/**
 * The session a routine's run works in: the routine's own thread, not the
 * conversation's active session, so a run's messages never land in a chat
 * the user was having. Started closed when the routine has none, so it
 * doesn't take the conversation over; the user opens it from the routine
 * or the sessions list and can chat there. Once it's full
 * (`grabBotSessionMaxMessages`) it carries on in a new linked session
 * (`rollOverLinkedSession`). Returns the session's id.
 */
export default async function ensureRoutineSession({ cron_job }: Params): Promise<number> {
    const user_id = cron_job.user_id!;
    const bot_id = Number(cron_job.bot_id);
    const workspace_id = Number(cron_job.workspace_id) || null;

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_SESSIONS>({
        sql: `SELECT s.* FROM bot_sessions s
            WHERE s.routine_id = ? AND s.user_id = ? AND s.bot_id = ? AND s.workspace_id IS ?
            ORDER BY s.id DESC LIMIT 1`,
        values: [cron_job.id!, user_id, bot_id, workspace_id],
    });

    const latest = res.payload?.[0];

    if (!latest?.id) {
        const created = await createBotSession({
            user_id,
            bot_id,
            workspace_id,
            status: "closed",
            routine_id: Number(cron_job.id!),
            title: cron_job.title || "Scheduled task",
        });

        return Number(created.id);
    }

    const count =
        Number(
            (
                await BunSQLite.sql<{ n: number }>({
                    sql: `SELECT COUNT(*) AS n FROM bot_messages WHERE session_id = ?`,
                    values: [latest.id!],
                })
            ).payload?.[0]?.n,
        ) || 0;

    if (count < (await grabBotSessionMaxMessages())) return Number(latest.id);

    const next = await rollOverLinkedSession({
        session: latest,
        user_id,
        bot_id,
        workspace_id,
    });

    return next || Number(latest.id);
}