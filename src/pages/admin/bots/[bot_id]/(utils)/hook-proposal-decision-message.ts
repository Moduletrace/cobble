import type { HookProposalView } from "@/src/types";
import hookProposalTitle from "./hook-proposal-title";

type Params = {
    view: HookProposalView;
};

/**
 * What the chat tells the bot once the user decided on its hook proposal,
 * so it carries on knowing what happened. Never the hook's URL: the
 * outcome doesn't hold it.
 */
export default function hookProposalDecisionMessage({ view }: Params) {
    const title = hookProposalTitle({ view });

    if (view.status == "rejected") return `I rejected hook proposal #${view.id} (${title}). Nothing was saved.`;

    if (view.status == "failed") return `I confirmed hook proposal #${view.id} (${title}), but it failed. ${view.outcome}`;

    return `I confirmed hook proposal #${view.id} (${title}). ${view.outcome}`;
}
