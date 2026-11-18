import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import carryOverBotSession from "./carry-over-bot-session";
import grabActiveBotSession from "./grab-active-bot-session";
import hasOpenSessionJob from "./has-open-session-job";
import writeSessionContinuation from "./write-session-continuation";

type Params = {
    user_id: number | string;
    bot_id: number;
    workspace_id?: number | null;
};

/**
 * Continue in new session, asked by the user from the conversation's
 * menu (and the automatic rollover, `rollOverBotSession`): does what the
 * bot does with `continue_in_new_session`. The bot's
 * text model writes the new session's title and the summary from the
 * session's latest messages (`writeSessionContinuation`), then
 * `carryOverBotSession` closes this session for good and opens the new one
 * with the summary. Refused while the bot is still working in the session,
 * since its answer would land in the closed one. Returns the summary's
 * message, for the caller to push.
 */
export default async function continueBotSession({
    user_id,
    bot_id,
    workspace_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_MESSAGES> {
    const active = await grabActiveBotSession({ user_id, bot_id, workspace_id });

    if (!active?.id) throw new AppError(`This conversation has no session to continue from yet.`);

    if (await hasOpenSessionJob({ session_id: active.id })) {
        throw new AppError(`The bot is still working in this session. Wait for it to finish, or stop it, then continue.`);
    }

    const written = await writeSessionContinuation({
        session_id: active.id,
        user_id,
        bot_id,
        workspace_id,
    });

    if (!written?.summary) {
        throw new AppError(`Couldn't write the summary to carry over. Try again.`);
    }

    return await carryOverBotSession({
        session_id: active.id,
        user_id,
        bot_id,
        workspace_id,
        summary: written.summary,
        title: written.title,
    });
}