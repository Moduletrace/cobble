import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_HOOKS } from "@/db/types/db";
import ensureBotSession from "../bot-sessions/ensure-bot-session";
import pickHookSession from "./pick-hook-session";

type Params = {
    hook: BUN_SQLITE_COBBLE_BOT_HOOKS;
    bot_id: number;
    workspace_id: number | null;
};

/**
 * The session a hook's call runs in: its own (`session_id`), open or
 * closed, or the conversation's active one when it follows that. When its
 * session is gone, a new one of its own takes its place and the hook is
 * linked to it.
 */
export default async function resolveHookSession({ hook, bot_id, workspace_id }: Params): Promise<number> {
    if (!hook.session_id) {
        return Number((await ensureBotSession({ user_id: hook.user_id!, bot_id, workspace_id })).id);
    }

    const session_id = (await pickHookSession({
        user_id: hook.user_id!,
        bot_id,
        workspace_id,
        choice: Number(hook.session_id),
        title: hook.title || `Hook ${hook.id}`,
        missing_starts_new: true,
    }))!;

    if (session_id != Number(hook.session_id)) {
        await BunSQLite.sql({
            sql: `UPDATE bot_hooks SET session_id = ?, updated_at = ? WHERE id = ?`,
            values: [session_id, Date.now(), hook.id!],
        });
    }

    return session_id;
}
