import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { HookProposalDecision } from "@/src/types";

type Params = {
    proposal_id: number;
    decision: "confirm" | "reject";
};

/**
 * Confirms or rejects a hook proposal from its card, returning it as it
 * now stands and, for a new hook called at a URL, its token (shown once).
 */
export default async function decideHookProposal({ proposal_id, decision }: Params) {
    return await fetchApi<{ proposal_id: number }, APIResponseObject<HookProposalDecision>>(
        `/api/admin/hook-proposals/${decision}-proposal`,
        { method: "POST", body: { proposal_id } },
    );
}
