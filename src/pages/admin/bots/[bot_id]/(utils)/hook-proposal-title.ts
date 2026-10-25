import type { HookProposalView } from "@/src/types";

type Params = {
    view: Pick<HookProposalView, "action" | "title">;
};

/**
 * What a hook proposal does, e.g. `Add hook GitHub pushes` or `Change
 * hook GitHub pushes`.
 */
export default function hookProposalTitle({ view }: Params) {
    return `${view.action == "change" ? "Change" : "Add"} hook ${view.title}`;
}
