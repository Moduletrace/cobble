import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotHookWithToken } from "@/src/types";
import { encrypt } from "@/src/utils/crypt";
import generateHookToken from "@/src/utils/generate-hook-token";
import grabUserBotHook from "./grab-user-bot-hook";
import syncComputerNotifyWatch from "./sync-computer-notify-watch";

type Params = {
    user_id: number | string;
    hook_id: number | string;
};

/**
 * Gives one of the user's hooks a new token: its old URL stops working at
 * once. Returns the hook and the new token, shown this once; a
 * notification hook's computer watcher gets the new URL instead.
 */
export default async function rotateBotHookToken({ user_id, hook_id }: Params): Promise<BotHookWithToken> {
    const hook = await grabUserBotHook({ user_id, hook_id });
    const { token, prefix, hash } = generateHookToken();

    const watching = hook.source == "browser_notifications";

    const res = await BunSQLite.sql({
        sql: `UPDATE bot_hooks SET token_prefix = ?, token_hash = ?, watch_token = ?, updated_at = ? WHERE id = ?`,
        values: [prefix, hash, watching ? await encrypt(token) : null, Date.now(), hook.id!],
    });

    if (!res.success) {
        throw new Error(`Couldn't give the hook a new URL: ${res.error}`);
    }

    if (watching && hook.watch_computer_id) {
        const watch = await syncComputerNotifyWatch({ computer_id: hook.watch_computer_id });

        return { hook: await grabUserBotHook({ user_id, hook_id: hook.id! }), watch };
    }

    return { hook: await grabUserBotHook({ user_id, hook_id: hook.id! }), token };
}
