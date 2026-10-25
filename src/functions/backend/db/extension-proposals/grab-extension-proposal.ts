import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_EXTENSION_PROPOSALS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import parseProposalRow from "./parse-proposal-row";

type Params = {
    proposal_id: number | string;
    /**
     * The super admin it was proposed to: nobody else reads it.
     */
    user_id: number | string;
};

/**
 * One proposal made to this user, or an `AppError`.
 */
export default async function grabExtensionProposal({ proposal_id, user_id }: Params) {
    const row = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_EXTENSION_PROPOSALS>({
            sql: `SELECT * FROM extension_proposals WHERE id = ? AND user_id = ?`,
            values: [proposal_id, user_id],
        })
    ).payload?.[0];

    if (!row) throw new AppError(`That proposal doesn't exist.`);

    return parseProposalRow({ row });
}
