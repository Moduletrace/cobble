import type { ExtensionProposalView } from "@/src/types";
import proposalTitle from "./proposal-title";

type Params = {
    view: ExtensionProposalView;
};

/**
 * What the chat tells the bot once the user decided on its proposal, so
 * it carries on knowing what happened (and never has to take the user's
 * word over the card's).
 */
export default function proposalDecisionMessage({ view }: Params) {
    const title = proposalTitle({ view });

    if (view.status == "rejected") return `I rejected proposal #${view.id} (${title}). Nothing was saved.`;

    if (view.status == "failed") return `I confirmed proposal #${view.id} (${title}), but it failed. ${view.outcome}`;

    return `I confirmed proposal #${view.id} (${title}). ${view.outcome}`;
}
