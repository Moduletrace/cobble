import BunSQLite from "@moduletrace/bun-sqlite";
import detachHookSessions from "./detach-hook-sessions";
import grabUserBotHook from "./grab-user-bot-hook";
import syncComputerNotifyWatch from "./sync-computer-notify-watch";
import syncHookRunners from "./sync-hook-runners";

type Params = {
    user_id: number | string;
    hook_id: number | string;
};

/**
 * Deletes one of the user's hooks and its recorded calls. Its sessions
 * stay: they're ordinary threads once no hook owns them
 * (`detachHookSessions`), so the user keeps their history. A run already
 * queued carries on. A notification hook's URL is taken off its
 * computer's watcher, and a runner it had is stopped before its row goes
 * (after that, no check would know it exists). A computer that can't be
 * reached doesn't stop the delete: its container is down anyway.
 */
export default async function deleteBotHook({ user_id, hook_id }: Params) {
    const hook = await grabUserBotHook({ user_id, hook_id });

    if (hook.runner_command || hook.runner_pid) {
        await syncHookRunners({ stop_hook_id: hook.id! }).catch(() => {});
    }

    await BunSQLite.sql({
        sql: `DELETE FROM bot_hook_events WHERE hook_id = ?`,
        values: [hook.id!],
    });

    await detachHookSessions({ hook_id: hook.id! });

    const res = await BunSQLite.sql({
        sql: `DELETE FROM bot_hooks WHERE id = ?`,
        values: [hook.id!],
    });

    if (!res.success) {
        throw new Error(`Couldn't delete the hook: ${res.error}`);
    }

    if (hook.source == "browser_notifications" && hook.watch_computer_id) {
        await syncComputerNotifyWatch({ computer_id: hook.watch_computer_id });
    }

    return hook;
}
