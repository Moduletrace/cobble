import type {
    BUN_SQLITE_COBBLE_BOT_HOOKS,
    BUN_SQLITE_COBBLE_BOT_SESSIONS,
} from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import { grabBotSessionMaxMessages } from "../app-settings/grab-bot-session-max-messages";
import activateBotSession from "../bot-sessions/activate-bot-session";
import createBotSession from "../bot-sessions/create-bot-session";
import grabUserBotSession from "../bot-sessions/grab-user-bot-session";
import rollOverLinkedSession from "../bot-sessions/roll-over-linked-session";

type Params = {
    hook: BUN_SQLITE_COBBLE_BOT_HOOKS;
    bot_id: number | string;
    workspace_id?: number | string | null;
};

/**
 * The session a hook's call works in: the hook's own thread, never the
 * conversation's active session by itself. Started closed when the hook has
 * none, so a run never lands in a chat the user was having; once it's full
 * (`grabBotSessionMaxMessages`) it carries on in a new linked session
 * (`rollOverLinkedSession`). A hook that isn't silent takes the
 * conversation over: its thread becomes the active session first, so the
 * user sees the run and can chat there (`activateBotSession`). Returns the
 * session's id.
 */
export default async function ensureHookSession({ hook, bot_id, workspace_id }: Params): Promise<number> {
    const user_id = hook.user_id!;
    const workspace = workspace_id ? Number(workspace_id) : null;

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_SESSIONS>({
        sql: `SELECT s.* FROM bot_sessions s
            WHERE s.hook_id = ? AND s.user_id = ? AND s.bot_id = ? AND s.workspace_id IS ?
            ORDER BY s.id DESC LIMIT 1`,
        values: [hook.id!, user_id, bot_id, workspace],
    });

    let session = res.payload?.[0];

    if (!session?.id) {
        session = await createBotSession({
            user_id,
            bot_id,
            workspace_id: workspace,
            status: "closed",
            hook_id: Number(hook.id!),
            title: `Hook: ${hook.title || hook.id}`,
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
                bot_id: Number(bot_id),
                workspace_id: workspace,
            });

            const carried = next ? await grabUserBotSession({ session_id: next, user_id }) : null;

            if (carried?.id) session = carried;
        }
    }

    if (!session?.id) {
        throw new Error(`Couldn't open a session for the hook ${hook.id}.`);
    }

    if (!hook.silent && session.status != "active") {
        session = await activateBotSession({ session });
    }

    return Number(session.id);
}