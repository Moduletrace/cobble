import { Webhook } from "lucide-react";
import Span from "@moduletrace/twui/layout/Span";
import useHookProposal from "../(hooks)/use-hook-proposal";
import hookProposalTitle from "../(utils)/hook-proposal-title";
import proposalStatusLabel from "../(utils)/proposal-status-label";
import HookProposalCard from "./hook-proposal-card";
import RefCardShell from "./ref-card-shell";

type Props = {
    proposal_id: number;
};

/**
 * A hook a bot proposed (`hookProposalRef`), shown in the message as the
 * card the user confirms or rejects it from, like a plan's card. Anyone it
 * wasn't proposed to sees its number only.
 */
export default function HookProposalRefCard({ proposal_id }: Props) {
    const { view, loading, setView } = useHookProposal({ proposal_id });

    if (!view) {
        return (
            <Span className="font-bold">
                {loading ? `hook proposal ${proposal_id}` : `hook proposal ${proposal_id} (not available)`}
            </Span>
        );
    }

    const title = hookProposalTitle({ view });
    const status = proposalStatusLabel({ view });
    const open = view.status == "pending" && !view.expired;

    return (
        <RefCardShell
            icon={<Webhook size={14} aria-hidden />}
            title={title}
            status={status}
            tone={open ? "warning" : view.status == "confirmed" ? "success" : "gray"}
            description={`${status}. ${view.bot_name} proposed this; nothing is saved until you confirm. Everything above the bot's own words is read from what Confirm would save.`}
        >
            <HookProposalCard view={view} onDecided={setView} onDone={() => {}} />
        </RefCardShell>
    );
}