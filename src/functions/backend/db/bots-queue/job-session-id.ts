import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import ensureBotSession from "../bot-sessions/ensure-bot-session";

type Params = {
    job: Pick<BUN_SQLITE_COBBLE_BOTS_QUEUE, "bot_id" | "session_id" | "workspace_id">;
};

/**
 * The session a job's result goes in: its own, or (for a job queued
 * without one) the active session of its bot's conversation there.
 */
export default async function jobSessionId({ job }: Params) {
    if (job.session_id) return Number(job.session_id);

    const session = await ensureBotSession({
        bot_id: job.bot_id!,
        workspace_id: job.workspace_id || null,
    });

    return Number(session.id);
}
