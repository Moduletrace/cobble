import BunSQLite from "@moduletrace/bun-sqlite";
import claimExtensionProposal from "./claim-extension-proposal";
import grabExtensionProposal from "./grab-extension-proposal";

type Params = {
    user_id: number | string;
    proposal_id: number | string;
};

/**
 * The user rejected a proposal from its card: nothing is saved.
 */
export default async function rejectExtensionProposal({ user_id, proposal_id }: Params) {
    const proposal = await grabExtensionProposal({ proposal_id, user_id });

    await claimExtensionProposal({ proposal, status: "rejected" });

    await BunSQLite.sql({
        sql: `UPDATE extension_proposals SET outcome = 'Rejected. Nothing was saved.', updated_at = ? WHERE id = ?`,
        values: [Date.now(), proposal.id],
    });

    return proposal;
}
