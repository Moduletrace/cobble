import type { BUN_SQLITE_COBBLE_KNOWLEDGEBASES } from "@/db/types/db";
import type { KnowledgebaseRecord } from "@/src/types";

type Params = {
    row: BUN_SQLITE_COBBLE_KNOWLEDGEBASES;
};

/**
 * A `knowledgebases` row, with its flags read as booleans.
 */
export default function parseKnowledgebaseRow({ row }: Params): KnowledgebaseRecord {
    return {
        id: Number(row.id),
        name: row.name || "",
        description: row.description || "",
        all_bots: row.all_bots == 1,
        enabled: row.enabled != 0,
        updated_at: typeof row.updated_at == "number" ? row.updated_at : null,
    };
}
