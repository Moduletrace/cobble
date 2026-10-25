import BunSQLite from "@moduletrace/bun-sqlite";
import claimHookProposal from "./claim-hook-proposal";
import grabHookProposal from "./grab-hook-proposal";

type Params = {
    user_id: number | string;
    proposal_id: number | string;
};

/**
 * The user rejected a hook proposal from its card: nothing is saved.
 */
export default async function rejectHookProposal({ user_id, proposal_id }: Params) {
    const proposal = await grabHookProposal({ proposal_id, user_id });

    await claimHookProposal({ proposal, status: "rejected" });

    await BunSQLite.sql({
        sql: `UPDATE hook_proposals SET outcome = 'Rejected. Nothing was saved.', updated_at = ? WHERE id = ?`,
        values: [Date.now(), proposal.id],
    });

    return proposal;
}
