import type { BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import { logError } from "@/src/functions/backend/logger";
import carryOverBotSession from "./carry-over-bot-session";
import continueBotSession from "./continue-bot-session";
import grabActiveBotSession from "./grab-active-bot-session";
import hasOpenSessionJob from "./has-open-session-job";

type Params = {
    user_id: number | string;
    bot_id: number;
    workspace_id?: number | null;
    /**
     * The conversation's active session, now full.
     */
    active: BUN_SQLITE_COBBLE_BOT_SESSIONS;
};

/**
 * The automatic rollover at the session length, when the user writes: the
 * conversation is carried into a new session the same way the bot or
 * Continue in new session carry it (`continueBotSession`: a written title
 * and summary, the full session closed for good). A model that can't
 * write the summary now falls back to the summary the session already
 * has. The full session is kept (and the rollover tried again on the
 * next message) while the bot still works in it, or when there's nothing
 * to carry. Returns the session the user's message goes in.
 */
export default async function rollOverBotSession({
    user_id,
    bot_id,
    workspace_id,
    active,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_SESSIONS> {
    if (await hasOpenSessionJob({ session_id: active.id! })) return active;

    const message = await continueBotSession({ user_id, bot_id, workspace_id }).catch(async (error: unknown) => {
        await logError({ title: `Session #${active.id} rollover summary not written`, error }).catch(() => {});

        if (!active.summary?.trim()) return null;

        return await carryOverBotSession({
            session_id: active.id!,
            user_id,
            bot_id,
            workspace_id,
            summary: active.summary,
            title: active.title,
        }).catch(() => null);
    });

    if (!message) return active;

    await pushBotNotice({ bot_id, message, quiet_push: true });

    return (await grabActiveBotSession({ user_id, bot_id, workspace_id })) || active;
}
