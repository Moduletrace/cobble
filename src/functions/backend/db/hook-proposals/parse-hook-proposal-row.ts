import type { BUN_SQLITE_COBBLE_HOOK_PROPOSALS } from "@/db/types/db";
import type { HookProposalAction } from "@/src/dict/bot-hook-dict";
import type { ExtensionProposalStatus } from "@/src/dict/extension-proposal-dict";
import { HookProposalDataSchema, type HookProposalData } from "@/src/schemas/bot-hook-schema";
import parseWithSchema from "@/src/utils/parse-with-schema";
import parseJsonColumn from "../extensions/parse-json-column";

type Params = {
    row: BUN_SQLITE_COBBLE_HOOK_PROPOSALS;
};

export type HookProposalRecord = {
    id: number;
    action: HookProposalAction;
    hook_id: number | null;
    title: string;
    data: HookProposalData;
    reason: string;
    status: ExtensionProposalStatus;
    outcome: string;
    result_id: number | null;
    expires_at: number;
    user_id: number;
    bot_id: number;
    session_id: number;
    workspace_id: number | null;
};

/**
 * A `hook_proposals` row with what it would save read and checked again
 * by its schema.
 */
export default function parseHookProposalRow({ row }: Params): HookProposalRecord {
    return {
        id: Number(row.id),
        action: row.action == "change" ? "change" : "create",
        hook_id: row.hook_id ? Number(row.hook_id) : null,
        title: row.title || "",
        data: parseWithSchema({
            schema: HookProposalDataSchema,
            data: parseJsonColumn<Record<string, unknown>>({ text: row.data, fallback: {} }),
        }),
        reason: row.reason || "",
        status: (row.status || "pending") as ExtensionProposalStatus,
        outcome: row.outcome || "",
        result_id: row.result_id ? Number(row.result_id) : null,
        expires_at: Number(row.expires_at) || 0,
        user_id: Number(row.user_id),
        bot_id: Number(row.bot_id),
        session_id: Number(row.session_id),
        workspace_id: row.workspace_id ? Number(row.workspace_id) : null,
    };
}
