import type { BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import activateBotSession from "./activate-bot-session";
import grabUserBotSession from "./grab-user-bot-session";

type Params = {
    session_id: number | string;
    user_id: number | string;
};

/**
 * Makes a closed session of one of the user's conversations the active
 * one again, so the bot carries on from where it left off. The session
 * that was active is closed (an empty one is deleted, `activateBotSession`).
 * A session the bot moved the conversation on from is never reopened.
 */
export default async function reopenBotSession({
    session_id,
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_SESSIONS> {
    const session = await grabUserBotSession({ session_id, user_id });

    if (!session?.id) {
        throw new AppError(`Session not found.`);
    }

    if (session.status == "active") return session;

    /**
     * A bot's part of a crew request is only ever read there.
     */
    if (session.ask_id) {
        throw new AppError(`Session not found.`);
    }

    /**
     * The bot moved the conversation on from it (`continue_in_new_session`):
     * reopened, the conversation would go on without what was said since,
     * and the user's last word there was already answered in the new one.
     */
    const carried_on = (
        await BunSQLite.sql({
            sql: `SELECT id FROM bot_messages WHERE carried_from_session_id = ? LIMIT 1`,
            values: [session.id],
        })
    ).payload?.[0];

    if (carried_on) {
        throw new AppError(`This conversation moved on to a newer session, so this one stays closed. You can still read it.`);
    }

    return await activateBotSession({ session });
}