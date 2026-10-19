import type { BUN_SQLITE_COBBLE_HARNESS_MODELS } from "@/db/types/db";
import type { HarnessCatalogModel } from "@/src/harness/types";

type Params = {
    row: BUN_SQLITE_COBBLE_HARNESS_MODELS;
};

/**
 * A `harness_models` row as a catalog entry.
 */
export default function harnessModelRowToCatalog({
    row,
}: Params): HarnessCatalogModel {
    return {
        slug: row.slug || "",
        name: row.name || row.slug || "",
        free: row.free == 1,
        input_modalities: parseList({ text: row.input_modalities }) || ["text"],
        output_modalities: parseList({ text: row.output_modalities }) || [
            "text",
        ],
        supports_tools: row.supports_tools == 1,
        context_length: numberOrUndefined(row.context_length),
        max_output_tokens: numberOrUndefined(row.max_output_tokens),
        voices: parseList({ text: row.voices }),
        intelligence_score: numberOrUndefined(row.intelligence_score),
        agentic_score: numberOrUndefined(row.agentic_score),
        released_at: numberOrUndefined(row.released_at),
        expires_at: numberOrUndefined(row.expires_at),
    };
}

function parseList({ text }: { text?: string | null }) {
    if (!text) return undefined;

    try {
        const value = JSON.parse(text);
        return Array.isArray(value) ? value.map(String) : undefined;
    } catch {
        return undefined;
    }
}

function numberOrUndefined(value: unknown) {
    return typeof value == "number" ? value : undefined;
}
