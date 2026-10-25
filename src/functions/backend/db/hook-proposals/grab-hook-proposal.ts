import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_HOOK_PROPOSALS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import parseHookProposalRow from "./parse-hook-proposal-row";

type Params = {
    proposal_id: number | string;
    /**
     * The user it was proposed to: nobody else reads it.
     */
    user_id: number | string;
};

/**
 * One hook proposal made to this user, or an `AppError`.
 */
export default async function grabHookProposal({ proposal_id, user_id }: Params) {
    const row = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_HOOK_PROPOSALS>({
            sql: `SELECT * FROM hook_proposals WHERE id = ? AND user_id = ?`,
            values: [proposal_id, user_id],
        })
    ).payload?.[0];

    if (!row) throw new AppError(`That proposal doesn't exist.`);

    return parseHookProposalRow({ row });
}
