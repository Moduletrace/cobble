import type { BUN_SQLITE_COBBLE_CUSTOM_TOOLS } from "@/db/types/db";
import type { CustomToolStatus } from "@/src/dict/custom-tool-dict";
import type { CustomToolRecord } from "@/src/types";
import parseJsonColumn from "./parse-json-column";

type Params = {
    row: BUN_SQLITE_COBBLE_CUSTOM_TOOLS;
};

/**
 * A `custom_tools` row with its JSON columns read.
 */
export default function parseCustomToolRow({ row }: Params): CustomToolRecord {
    return {
        id: Number(row.id),
        name: row.name || "",
        description: row.description || "",
        parameters: parseJsonColumn<Record<string, unknown>>({
            text: row.parameters,
            fallback: { type: "object", properties: {} },
        }),
        all_bots: row.all_bots == 1,
        enabled: row.enabled != 0,
        status: (row.status || "untested") as CustomToolStatus,
        last_error: row.last_error || "",
        last_checked_at: typeof row.last_checked_at == "number" ? row.last_checked_at : null,
        kind: row.kind || "prompt",
        config: parseJsonColumn<Record<string, unknown>>({ text: row.config, fallback: {} }),
    } as CustomToolRecord;
}
