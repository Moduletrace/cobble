import type { BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import { logError } from "@/src/functions/backend/logger";
import carryOverBotSession from "./carry-over-bot-session";
import hasOpenSessionJob from "./has-open-session-job";
import writeSessionContinuation from "./write-session-continuation";

type Params = {
    /**
     * The routine's or hook's latest session, full to the app setting.
     */
    session: BUN_SQLITE_COBBLE_BOT_SESSIONS;
    user_id: number | string;
    bot_id: number;
    workspace_id?: number | null;
};

/**
 * Carries a routine's or a silent hook's own thread into its next session
 * once it's full (`writeSessionContinuation`), like Continue in a new
 * session does for the conversation: the summary opens the new session as
 * its first message and `previous_session_id` links it, with the same
 * routine or hook attached, still closed so no run takes the chat over.
 * Null when it can't move (the bot still has work in it) or there is
 * nothing to carry (the model wrote no summary and none was stored): the
 * run then lands in the full session, which never blocks it.
 */
export default async function rollOverLinkedSession({
    session,
    user_id,
    bot_id,
    workspace_id,
}: Params): Promise<number | null> {
    if (!session.id || (await hasOpenSessionJob({ session_id: session.id }))) return null;

    const written = await writeSessionContinuation({
        session_id: session.id,
        user_id,
        bot_id,
        workspace_id,
    }).catch((error: unknown) => {
        logError({ title: "Couldn't write the summary to carry a session over", error }).catch(() => {});
        return null;
    });

    const summary = written?.summary || session.summary?.trim();

    if (!summary) return null;

    const message = await carryOverBotSession({
        session_id: session.id,
        user_id,
        bot_id,
        workspace_id,
        summary,
        title: written?.title,
        allow_inactive: true,
        next_status: "closed",
    }).catch((error: unknown) => {
        logError({ title: "Couldn't carry a session over", error }).catch(() => {});
        return null;
    });

    return message ? Number(message.session_id) : null;
}