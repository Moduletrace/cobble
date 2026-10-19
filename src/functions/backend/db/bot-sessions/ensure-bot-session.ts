import type { BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import createBotSession from "./create-bot-session";
import grabActiveBotSession from "./grab-active-bot-session";
import startBotSession from "./start-bot-session";

type Params = {
    /**
     * The user the conversation is with.
     */
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    /**
     * Start the next session when the active one is full
     * (`AppData.BotSessionMaxMessages`). Set when the user writes, so a
     * message never lands in a session that's about to be cut.
     */
    rollover?: boolean;
};

/**
 * The user's conversation's active session, started first when there is none
 * (carrying on from its latest closed one) or, with `rollover`, when the
 * active one is full.
 */
export default async function ensureBotSession({
    user_id,
    bot_id,
    workspace_id,
    rollover,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_SESSIONS> {
    const active = await grabActiveBotSession({ user_id, bot_id, workspace_id });

    if (active?.id) {
        if (!rollover) return active;

        const count =
            Number(
                (
                    await BunSQLite.sql<{ n: number }>({
                        sql: `SELECT COUNT(*) AS n FROM bot_messages WHERE session_id = ?`,
                        values: [active.id],
                    })
                ).payload?.[0]?.n,
            ) || 0;

        return count < AppData.BotSessionMaxMessages
            ? active
            : await startBotSession({ user_id, bot_id, workspace_id });
    }

    const latest = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_SESSIONS>({
            sql: `SELECT id FROM bot_sessions WHERE user_id = ? AND bot_id = ? AND workspace_id IS ?
                ORDER BY last_activity_at DESC, id DESC LIMIT 1`,
            values: [user_id, bot_id, workspace_id ? Number(workspace_id) : null],
        })
    ).payload?.[0];

    return await createBotSession({
        user_id,
        bot_id,
        workspace_id,
        previous_session_id: latest?.id || null,
    });
}
