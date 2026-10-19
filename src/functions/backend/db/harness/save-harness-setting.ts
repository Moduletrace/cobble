import BunSQLite from "@moduletrace/bun-sqlite";
import type { HarnessKind } from "@/src/dict/harness-dict";
import AppError from "@/src/utils/app-error";
import assertHarnessModel from "./assert-harness-model";
import assertHarnessProvider from "./assert-harness-provider";

type Params = {
    harness: HarnessKind;
    /**
     * A `harness_models` row, or null to pick automatically.
     */
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
 * Saves a harness's model setting. The picked model must be available and
 * able to do the harness's job. Text can't be turned off.
 */
export default async function saveHarnessSetting({
    harness,
    model_id,
    provider_id = null,
    fallback,
    enabled,
    options,
}: Params) {
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
        sql: `INSERT INTO harness_settings (created_at, updated_at, harness, model_id, provider_id, fallback, enabled, options)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(harness) DO UPDATE SET updated_at = excluded.updated_at,
            model_id = excluded.model_id, provider_id = excluded.provider_id, fallback = excluded.fallback,
            enabled = excluded.enabled, options = excluded.options`,
        values: [
            now,
            now,
            harness,
            model_id,
            provider_id,
            fallback ? 1 : 0,
            enabled ? 1 : 0,
            JSON.stringify(options || {}),
        ],
    });

    if (!res.success) {
        throw new Error(`Couldn't save the model setting: ${res.error}`);
    }
}
