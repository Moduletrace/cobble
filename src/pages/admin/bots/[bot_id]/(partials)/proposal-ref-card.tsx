import { BookOpen, PlugZap, Wrench } from "lucide-react";
import Span from "@moduletrace/twui/layout/Span";
import type { ExtensionProposalView } from "@/src/types";
import useExtensionProposal from "../(hooks)/use-extension-proposal";
import proposalStatusLabel from "../(utils)/proposal-status-label";
import proposalTitle from "../(utils)/proposal-title";
import ProposalCard from "./proposal-card";
import RefCardShell from "./ref-card-shell";

type Props = {
    proposal_id: number;
};

/**
 * An MCP server, tool or skill the coordinator proposed (`proposalRef`),
 * shown in the message as the card the super admin confirms or rejects it
 * from, like a plan's card, so the decision is never hidden behind a chip.
 * Anyone it wasn't proposed to sees its number only.
 */
export default function ProposalRefCard({ proposal_id }: Props) {
    const { view, loading, setView } = useExtensionProposal({ proposal_id });

    if (!view) {
        return <Span className="font-bold">{loading ? `proposal ${proposal_id}` : `proposal ${proposal_id} (not available)`}</Span>;
    }

    const Icon = view.kind == "mcp" ? PlugZap : view.kind == "skill" ? BookOpen : Wrench;
    const title = proposalTitle({ view });
    const status = proposalStatusLabel({ view });
    const open = view.status == "pending" && !view.expired;

    return (
        <RefCardShell
            icon={<Icon size={14} aria-hidden />}
            title={title}
            status={status}
            tone={open ? "warning" : view.status == "confirmed" ? "success" : "gray"}
            description={`${status}. The coordinator proposed this; nothing is saved until you confirm. Everything above the bot's own notes is read from what Confirm would save.`}
        >
            <ProposalCard view={view as ExtensionProposalView} onDecided={setView} />
        </RefCardShell>
    );
}