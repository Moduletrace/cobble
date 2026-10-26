import type { BUN_SQLITE_COBBLE_SKILLS } from "@/db/types/db";
import type { SkillRecord } from "@/src/types";

type Params = {
    row: BUN_SQLITE_COBBLE_SKILLS;
};

/**
 * A `skills` row, with its flags read as booleans.
 */
export default function parseSkillRow({ row }: Params): SkillRecord {
    return {
        id: Number(row.id),
        name: row.name || "",
        slug: row.slug || "",
        description: row.description || "",
        body: row.body || "",
        all_bots: row.all_bots == 1,
        enabled: row.enabled != 0,
        updated_at: typeof row.updated_at == "number" ? row.updated_at : null,
    };
}
