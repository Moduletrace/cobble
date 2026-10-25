import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_HOOK_PROPOSALS, BunSQLiteTables } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import type { HookProposalData } from "@/src/schemas/bot-hook-schema";
import checkHookProposal from "./check-hook-proposal";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    session_id: number | string;
    workspace_id?: number | string | null;
    /**
     * The hook it changes; none for a new one.
     */
    hook_id?: number | string | null;
    data: HookProposalData;
    reason: string;
};

/**
 * Stores a hook a bot proposes making or changing, pending until the user
 * confirms it from its card in the chat (`checkHookProposal` first).
 * Nothing is saved here. A proposal it makes again for the same hook (or,
 * for a new one, the same name) in the same conversation replaces the one
 * before, so only the latest card can be confirmed. Returns its id.
 */
export default async function createHookProposal({
    user_id,
    bot_id,
    session_id,
    workspace_id,
    hook_id,
    data,
    reason,
}: Params) {
    const checked = await checkHookProposal({ user_id, bot_id, workspace_id, hook_id, data });
    const now = Date.now();

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_HOOK_PROPOSALS, (typeof BunSQLiteTables)[number]>({
        table: "hook_proposals",
        data: [
            {
                action: checked.action,
                hook_id: checked.current?.id ? Number(checked.current.id) : undefined,
                title: checked.title,
                data: JSON.stringify(checked.data),
                reason,
                status: "pending",
                outcome: "",
                expires_at: now + AppData.ExtensionProposalTtlMs,
                user_id: Number(user_id),
                bot_id: Number(bot_id),
                session_id: Number(session_id),
                workspace_id: workspace_id ? Number(workspace_id) : undefined,
            },
        ],
    });

    const id = Number(res.singleRes?.id || res.postInsertReturn?.insertId);

    if (!res.success || !id) throw new Error(`Couldn't store the proposal: ${res.msg}`);

    await BunSQLite.sql({
        sql: `UPDATE hook_proposals SET status = 'replaced', outcome = ?, decided_at = ?, updated_at = ?
            WHERE session_id = ? AND status = 'pending' AND id != ?
            AND (${checked.current?.id ? "hook_id = ?" : "hook_id IS NULL AND title = ? COLLATE NOCASE"})`,
        values: [
            `Replaced by proposal #${id}.`,
            now,
            now,
            Number(session_id),
            id,
            checked.current?.id || checked.title,
        ],
    });

    return id;
}
