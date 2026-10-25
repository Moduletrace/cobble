import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_EXTENSION_PROPOSALS, BunSQLiteTables } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import type { SaveCustomToolRequest, SaveMcpServerRequest, SaveSkillRequest } from "@/src/schemas/extension-schema";
import checkProposalData from "./check-proposal-data";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    session_id: number | string;
    workspace_id?: number | string | null;
    research: string;
    sources: string[];
} & (
    | { kind: "mcp"; data: SaveMcpServerRequest }
    | { kind: "tool"; data: SaveCustomToolRequest }
    | { kind: "skill"; data: SaveSkillRequest }
);

/**
 * Stores what a bot proposes adding or changing (an MCP server, a tool or
 * a skill), pending until the user
 * confirms it from the chat. Nothing is saved, connected or run here. A
 * proposal it makes again for the same server or tool in the same
 * conversation replaces the one before, so only the latest card can be
 * confirmed. Returns its id.
 */
export default async function createExtensionProposal(params: Params) {
    if (params.kind != "skill") checkProposalData(params);

    const extension_id =
        (params.kind == "mcp"
            ? params.data.mcp_server_id
            : params.kind == "skill"
              ? params.data.skill_id
              : params.data.custom_tool_id) || undefined;
    const now = Date.now();

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_EXTENSION_PROPOSALS, (typeof BunSQLiteTables)[number]>({
        table: "extension_proposals",
        data: [
            {
                kind: params.kind,
                extension_id,
                name: params.data.name,
                data: JSON.stringify(params.data),
                research: params.research,
                sources: JSON.stringify(params.sources),
                status: "pending",
                outcome: "",
                expires_at: now + AppData.ExtensionProposalTtlMs,
                user_id: Number(params.user_id),
                bot_id: Number(params.bot_id),
                session_id: Number(params.session_id),
                workspace_id: params.workspace_id ? Number(params.workspace_id) : undefined,
            },
        ],
    });

    const id = Number(res.singleRes?.id || res.postInsertReturn?.insertId);

    if (!res.success || !id) throw new Error(`Couldn't store the proposal: ${res.msg}`);

    await BunSQLite.sql({
        sql: `UPDATE extension_proposals SET status = 'replaced', outcome = ?, decided_at = ?, updated_at = ?
            WHERE session_id = ? AND kind = ? AND status = 'pending' AND id != ?
            AND (${extension_id ? "extension_id = ?" : "extension_id IS NULL AND name = ? COLLATE NOCASE"})`,
        values: [
            `Replaced by proposal #${id}.`,
            now,
            now,
            Number(params.session_id),
            params.kind,
            id,
            extension_id || params.data.name,
        ],
    });

    return id;
}
