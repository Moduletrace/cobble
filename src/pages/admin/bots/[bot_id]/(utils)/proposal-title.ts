import { ExtensionProposalKinds } from "@/src/dict/extension-proposal-dict";
import type { ExtensionProposalView } from "@/src/types";

type Params = {
    view: Pick<ExtensionProposalView, "kind" | "extension_id" | "name">;
};

/**
 * What a proposal does, e.g. `Add MCP server GitHub` or `Change tool
 * weather`.
 */
export default function proposalTitle({ view }: Params) {
    const kind = ExtensionProposalKinds.find((k) => k.value == view.kind)?.title || view.kind;

    return `${view.extension_id ? "Change" : "Add"} ${kind} ${view.name}`;
}
