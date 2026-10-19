import BunSQLite from "@moduletrace/bun-sqlite";
import type { HarnessKind } from "@/src/dict/harness-dict";
import AppError from "@/src/utils/app-error";
import assertHarnessModel from "./assert-harness-model";
import assertHarnessProvider from "./assert-harness-provider";

type Params = {
    /**
     * A worker bot the caller has checked belongs to the session user.
     */
    bot_id: number;
    harness: HarnessKind;
    /**
     * Drop the bot's own setting and use the default again.
     */
    inherit: boolean;
    model_id: number | null;
    /**
     * Limits the harness to one provider; null: any.
     */
    provider_id?: number | null;
    fallback: boolean;
    enabled: boolean;
    options?: Record<string, unknown>;
};

/**
 * Saves (or, with `inherit`, removes) a worker bot's own setting for one
 * harness. Same rules as the default: the model must be available and fit
 * the job, and text can't be turned off.
 */
export default async function saveBotHarnessSetting({
    bot_id,
    harness,
    inherit,
    model_id,
    provider_id = null,
    fallback,
    enabled,
    options,
}: Params) {
    if (inherit) {
        await BunSQLite.sql({
            sql: `DELETE FROM bot_harness_settings WHERE bot_id = ? AND harness = ?`,
            values: [bot_id, harness],
        });
        return;
    }

    if (harness == "text" && !enabled) {
        throw new AppError(`The text model can't be turned off.`);
    }

    if (provider_id) {
        await assertHarnessProvider({ provider_id });
    }

    if (model_id) {
        await assertHarnessModel({ harness, model_id, provider_id });
    }

    const now = Date.now();

    const res = await BunSQLite.sql({
        sql: `INSERT INTO bot_harness_settings (created_at, updated_at, bot_id, harness, model_id, provider_id, fallback, enabled, options)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(bot_id, harness) DO UPDATE SET updated_at = excluded.updated_at,
            model_id = excluded.model_id, provider_id = excluded.provider_id, fallback = excluded.fallback,
            enabled = excluded.enabled, options = excluded.options`,
        values: [
            now,
            now,
            bot_id,
            harness,
            model_id,
            provider_id,
            fallback ? 1 : 0,
            enabled ? 1 : 0,
            JSON.stringify(options || {}),
        ],
    });

    if (!res.success) {
        throw new Error(`Couldn't save the bot's model setting: ${res.error}`);
    }
}
