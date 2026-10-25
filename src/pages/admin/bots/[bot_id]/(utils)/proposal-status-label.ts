import type { ExtensionProposalView } from "@/src/types";

type Params = {
    view: Pick<ExtensionProposalView, "status" | "expired">;
};

/**
 * Where a proposal stands, in a word for its chip.
 */
export default function proposalStatusLabel({ view }: Params) {
    if (view.expired) return "Expired";

    return {
        pending: "Waiting for you",
        confirmed: "Confirmed",
        rejected: "Rejected",
        replaced: "Replaced",
        failed: "Failed",
    }[view.status];
}
