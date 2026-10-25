import BunSQLite from "@moduletrace/bun-sqlite";
import grabUserBotHook from "./grab-user-bot-hook";
import syncComputerNotifyWatch from "./sync-computer-notify-watch";

type Params = {
    user_id: number | string;
    hook_id: number | string;
};

/**
 * Deletes one of the user's hooks and its recorded calls (foreign keys
 * are off outside the server, so the calls go first, explicitly). A run
 * already queued carries on. A notification hook's URL is taken off its
 * computer's watcher.
 */
export default async function deleteBotHook({ user_id, hook_id }: Params) {
    const hook = await grabUserBotHook({ user_id, hook_id });

    await BunSQLite.sql({
        sql: `DELETE FROM bot_hook_events WHERE hook_id = ?`,
        values: [hook.id!],
    });

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
