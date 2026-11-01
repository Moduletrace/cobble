import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_HOOKS } from "@/db/types/db";
import createBotSession from "../bot-sessions/create-bot-session";

type Params = {
    hook: BUN_SQLITE_COBBLE_BOT_HOOKS;
    bot_id: number;
    workspace_id: number | null;
};

/**
 * The hidden session a hook's runs work in where it runs now (status
 * `hook`, in no conversation or list), started on its first call there.
 * Every session query that lists or picks a conversation leaves these out
 * (`hook_id IS NULL`); their results are read in the hook's thread.
 */
export default async function ensureHookSession({ hook, bot_id, workspace_id }: Params): Promise<number> {
    const existing = (
        await BunSQLite.sql<{ id: number }>({
            sql: `SELECT id FROM bot_sessions WHERE hook_id = ? AND bot_id = ? AND workspace_id IS ? ORDER BY id DESC LIMIT 1`,
            values: [hook.id!, bot_id, workspace_id],
        })
    ).payload?.[0];

    if (existing?.id) return Number(existing.id);

    const session = await createBotSession({
        user_id: hook.user_id!,
        bot_id,
        workspace_id,
        status: "hook",
        hook_id: Number(hook.id),
        title: `Hook: ${hook.title || hook.id}`,
    });

    return Number(session.id);
}
