import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import type { ExtensionProposalRecord } from "./parse-proposal-row";

type Params = {
    proposal: ExtensionProposalRecord;
    status: "confirmed" | "rejected";
};

/**
 * Decides a proposal exactly once: only a pending one moves, and only a
 * proposal that hasn't expired can be confirmed, so two tabs or a double
 * click never save it twice. Throws why when it can't.
 */
export default async function claimExtensionProposal({ proposal, status }: Params) {
    const now = Date.now();
    const claimed = await BunSQLite.sql<{ id: number }>({
        sql: `UPDATE extension_proposals SET status = ?, decided_at = ?, updated_at = ?
            WHERE id = ? AND status = 'pending' ${status == "confirmed" ? "AND expires_at > ?" : ""} RETURNING id`,
        values: [status, now, now, proposal.id, ...(status == "confirmed" ? [now] : [])],
    });

    if (claimed.payload?.[0]) return;

    if (proposal.status != "pending") throw new AppError(`This proposal was already ${proposal.status}.`);

    throw new AppError(`This proposal expired. Ask the bot to propose it again.`);
}
