import type { BUN_SQLITE_COBBLE_EXTENSION_PROPOSALS } from "@/db/types/db";
import type { ExtensionProposalKind, ExtensionProposalStatus } from "@/src/dict/extension-proposal-dict";
import {
    SaveCustomToolRequestSchema,
    SaveMcpServerRequestSchema,
    SaveSkillRequestSchema,
    type SaveCustomToolRequest,
    type SaveMcpServerRequest,
    type SaveSkillRequest,
} from "@/src/schemas/extension-schema";
import parseWithSchema from "@/src/utils/parse-with-schema";
import parseJsonColumn from "../extensions/parse-json-column";

type Params = {
    row: BUN_SQLITE_COBBLE_EXTENSION_PROPOSALS;
};

export type ExtensionProposalRecord = {
    id: number;
    extension_id: number | null;
    name: string;
    research: string;
    sources: string[];
    status: ExtensionProposalStatus;
    outcome: string;
    result_id: number | null;
    expires_at: number;
    user_id: number;
    bot_id: number;
    session_id: number;
} & (
    | { kind: "mcp"; data: SaveMcpServerRequest }
    | { kind: "tool"; data: SaveCustomToolRequest }
    | { kind: "skill"; data: SaveSkillRequest }
);

/**
 * An `extension_proposals` row with its config read and checked again by
 * the settings forms' schemas, so what confirm saves is what they'd allow.
 */
export default function parseProposalRow({ row }: Params): ExtensionProposalRecord {
    const kind = (row.kind || "mcp") as ExtensionProposalKind;
    const raw = parseJsonColumn<Record<string, unknown>>({ text: row.data, fallback: {} });
    const base = {
        id: Number(row.id),
        extension_id: row.extension_id ? Number(row.extension_id) : null,
        name: row.name || "",
        research: row.research || "",
        sources: parseJsonColumn<string[]>({ text: row.sources, fallback: [] }),
        status: (row.status || "pending") as ExtensionProposalStatus,
        outcome: row.outcome || "",
        result_id: row.result_id ? Number(row.result_id) : null,
        expires_at: Number(row.expires_at) || 0,
        user_id: Number(row.user_id),
        bot_id: Number(row.bot_id),
        session_id: Number(row.session_id),
    };

    if (kind == "mcp") return { ...base, kind, data: parseWithSchema({ schema: SaveMcpServerRequestSchema, data: raw }) };

    if (kind == "skill") return { ...base, kind, data: parseWithSchema({ schema: SaveSkillRequestSchema, data: raw }) };

    return { ...base, kind: "tool", data: parseWithSchema({ schema: SaveCustomToolRequestSchema, data: raw }) };
}
