import BunSQLite from "@moduletrace/bun-sqlite";
import type { HarnessCatalogModel } from "@/src/harness/types";

type Params = {
    provider_id: number;
    models: HarnessCatalogModel[];
    now?: number;
};

const Columns = [
    "created_at",
    "updated_at",
    "provider_id",
    "slug",
    "name",
    "free",
    "available",
    "input_modalities",
    "output_modalities",
    "supports_tools",
    "context_length",
    "max_output_tokens",
    "voices",
    "supported_parameters",
    "intelligence_score",
    "agentic_score",
    "released_at",
    "expires_at",
    "last_seen_at",
] as const;

/**
 * Rows per statement, well under SQLite's bound-variable limit.
 */
const ChunkSize = 50;

/**
 * Writes a provider's model list: new models are added, listed ones are
 * refreshed and marked available, and models it no longer lists are kept
 * but marked unavailable (a super admin's pick may point at them).
 */
export default async function upsertHarnessModels({
    provider_id,
    models,
    now = Date.now(),
}: Params) {
    const unique = [...new Map(models.map((m) => [m.slug, m])).values()];

    for (let i = 0; i < unique.length; i += ChunkSize) {
        const chunk = unique.slice(i, i + ChunkSize);

        const res = await BunSQLite.sql({
            sql: `INSERT INTO harness_models (${Columns.join(", ")})
                VALUES ${chunk.map(() => `(${Columns.map(() => "?").join(", ")})`).join(", ")}
                ON CONFLICT(provider_id, slug) DO UPDATE SET
                ${Columns.filter((c) => c != "created_at" && c != "provider_id" && c != "slug")
                    .map((c) => `${c} = excluded.${c}`)
                    .join(", ")}`,
            values: chunk.flatMap((model) => [
                now,
                now,
                provider_id,
                model.slug,
                model.name || model.slug,
                model.free ? 1 : 0,
                1,
                JSON.stringify(model.input_modalities),
                JSON.stringify(model.output_modalities),
                model.supports_tools ? 1 : 0,
                model.context_length ?? null,
                model.max_output_tokens ?? null,
                model.voices ? JSON.stringify(model.voices) : null,
                model.supported_parameters ? JSON.stringify(model.supported_parameters) : null,
                model.intelligence_score ?? null,
                model.agentic_score ?? null,
                model.released_at ?? null,
                model.expires_at ?? null,
                now,
            ]),
        });

        if (!res.success) {
            throw new Error(`Couldn't save the model list: ${res.error}`);
        }
    }

    await BunSQLite.sql({
        sql: `UPDATE harness_models SET available = 0, updated_at = ?
            WHERE provider_id = ? AND available = 1 AND (last_seen_at IS NULL OR last_seen_at < ?)`,
        values: [now, provider_id, now],
    });

    return unique.length;
}
