import type { BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import { grabBotSessionMaxMessages } from "../app-settings/grab-bot-session-max-messages";
import createBotSession from "./create-bot-session";
import grabActiveBotSession from "./grab-active-bot-session";
import rollOverBotSession from "./roll-over-bot-session";

type Params = {
    /**
     * The user the conversation is with.
     */
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    /**
     * Carry the conversation into a new session when the active one is
     * full (`grabBotSessionMaxMessages`, `rollOverBotSession`). Set when the user writes, so a
     * message never lands in a session that's about to be cut.
     */
    rollover?: boolean;
};

/**
 * The user's conversation's active session, started first when there is none
 * (fresh) or, with `rollover`, carried into a new one when the active one
 * is full.
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

        return count < (await grabBotSessionMaxMessages())
            ? active
            : await rollOverBotSession({
                  user_id,
                  bot_id: Number(bot_id),
                  workspace_id: workspace_id ? Number(workspace_id) : null,
                  active,
              });
    }

    return await createBotSession({ user_id, bot_id, workspace_id });
}
