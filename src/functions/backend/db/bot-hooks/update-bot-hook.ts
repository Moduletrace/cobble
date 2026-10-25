import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotHookSignatureFormat } from "@/src/dict/bot-hook-dict";
import AppError from "@/src/utils/app-error";
import { encrypt } from "@/src/utils/crypt";
import grabUserBotHook from "./grab-user-bot-hook";
import syncComputerNotifyWatch from "./sync-computer-notify-watch";

type Params = {
    user_id: number | string;
    hook_id: number | string;
    /**
     * Only the fields given are changed. `signing_secret: null` stops
     * checking signatures; a new one replaces the old.
     */
    data: {
        title?: string;
        instructions?: string;
        enabled?: boolean;
        signing_secret?: string | null;
        signature_header?: string;
        signature_format?: BotHookSignatureFormat;
        /**
         * A browser-notification hook's filter; empty takes them all.
         */
        watch_filter?: string;
    };
};

/**
 * Changes one of the user's hooks: its name and brief, pauses or resumes
 * it, sets how its calls are signed or, for browser notifications, which
 * ones it takes. Its token stays (rotate it with `rotateBotHookToken`).
 * Pausing or resuming a notification hook updates its computer's watcher.
 * Returns the hook.
 */
export default async function updateBotHook({ user_id, hook_id, data }: Params) {
    const hook = await grabUserBotHook({ user_id, hook_id });

    const sets: string[] = [];
    const values: (string | number | null)[] = [];

    const set = (field: string, value: string | number | null) => {
        sets.push(`${field} = ?`);
        values.push(value);
    };

    if (data.title !== undefined) set("title", data.title);
    if (data.instructions !== undefined) set("instructions", data.instructions);

    if (data.enabled !== undefined) {
        set("enabled", data.enabled ? 1 : 0);
        if (data.enabled) set("last_error", null);
    }

    const watching = hook.source == "browser_notifications";

    if (data.watch_filter !== undefined) {
        if (!watching) throw new AppError(`Only a browser-notification hook has a filter.`);

        set("watch_filter", data.watch_filter.trim() || null);
    }

    if (watching && (data.signing_secret !== undefined || data.signature_header !== undefined)) {
        throw new AppError(`A browser-notification hook isn't signed.`);
    }

    if (data.signing_secret === null) {
        set("signing_secret", null);
        set("signature_header", null);
        set("signature_format", null);
    } else {
        const secret = data.signing_secret?.trim();
        const signed = Boolean(secret || hook.has_signing_secret);

        const header = (data.signature_header ?? hook.signature_header ?? "").trim();

        if (secret && !header) {
            throw new AppError(`Say which header carries the signature.`);
        }

        if (secret) set("signing_secret", await encrypt(secret));

        if (data.signature_header !== undefined || data.signature_format !== undefined) {
            if (!signed) {
                throw new AppError(`Set a signing secret first.`);
            }

            if (data.signature_header !== undefined) {
                if (!header) throw new AppError(`Say which header carries the signature.`);

                set("signature_header", header);
            }
            if (data.signature_format !== undefined) set("signature_format", data.signature_format);
        }

        if (secret && !hook.signature_format && data.signature_format === undefined) {
            set("signature_format", "sha256=hex");
        }
    }

    if (!sets.length) return hook;

    set("updated_at", Date.now());

    const res = await BunSQLite.sql({
        sql: `UPDATE bot_hooks SET ${sets.join(", ")} WHERE id = ?`,
        values: [...values, hook.id!],
    });

    if (!res.success) {
        throw new Error(`Couldn't update the hook: ${res.error}`);
    }

    if (watching && data.enabled !== undefined && hook.watch_computer_id) {
        await syncComputerNotifyWatch({ computer_id: hook.watch_computer_id });
    }

    return await grabUserBotHook({ user_id, hook_id: hook.id! });
}
