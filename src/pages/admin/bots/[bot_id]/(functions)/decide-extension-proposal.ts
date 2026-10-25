import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { ExtensionProposalView } from "@/src/types";

type Params = {
    proposal_id: number;
    decision: "confirm" | "reject";
};

/**
 * Confirms or rejects a proposal from its card, returning it as it now
 * stands (with what confirming did).
 */
export default async function decideExtensionProposal({ proposal_id, decision }: Params) {
    return await fetchApi<{ proposal_id: number }, APIResponseObject<ExtensionProposalView>>(
        `/api/admin/extension-proposals/${decision}-proposal`,
        { method: "POST", body: { proposal_id } },
    );
}
