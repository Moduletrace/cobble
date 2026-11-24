import type {
    BUN_SQLITE_COBBLE_BOT_SESSIONS,
    BUN_SQLITE_COBBLE_CRON_JOBS,
} from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import { grabBotSessionMaxMessages } from "../app-settings/grab-bot-session-max-messages";
import activateBotSession from "./activate-bot-session";
import createBotSession from "./create-bot-session";
import grabUserBotSession from "./grab-user-bot-session";
import rollOverLinkedSession from "./roll-over-linked-session";

type Params = {
    cron_job: BUN_SQLITE_COBBLE_CRON_JOBS;
};

/**
 * The session a routine's run works in: the routine's own thread, never
 * another conversation. It takes the conversation over like a hook, so the
 * user sees the run and can chat there: started closed when the routine has
 * none, then activated (`activateBotSession`). Once it's full
 * (`grabBotSessionMaxMessages`) it carries on in a new linked session
 * (`rollOverLinkedSession`), activated too. Returns the session's id.
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

    let session = res.payload?.[0];

    if (!session?.id) {
        session = await createBotSession({
            user_id,
            bot_id,
            workspace_id,
            status: "closed",
            routine_id: Number(cron_job.id!),
            title: cron_job.title || "Scheduled task",
        });
    } else {
        const count =
            Number(
                (
                    await BunSQLite.sql<{ n: number }>({
                        sql: `SELECT COUNT(*) AS n FROM bot_messages WHERE session_id = ?`,
                        values: [session.id!],
                    })
                ).payload?.[0]?.n,
            ) || 0;

        if (count >= (await grabBotSessionMaxMessages())) {
            const next = await rollOverLinkedSession({
                session,
                user_id,
                bot_id,
                workspace_id,
            });

            const carried = next ? await grabUserBotSession({ session_id: next, user_id }) : null;

            if (carried?.id) session = carried;
        }
    }

    if (!session?.id) {
        throw new Error(`Couldn't open a session for the routine ${cron_job.id}.`);
    }

    if (session.status != "active") {
        session = await activateBotSession({ session });
    }

    return Number(session.id);
}
