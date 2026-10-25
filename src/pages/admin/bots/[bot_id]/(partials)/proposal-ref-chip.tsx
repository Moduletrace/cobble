import { useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import Button from "@moduletrace/twui/layout/Button";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { BookOpen, PlugZap, Wrench } from "lucide-react";
import type { ExtensionProposalView } from "@/src/types";
import useExtensionProposal from "../(hooks)/use-extension-proposal";
import proposalStatusLabel from "../(utils)/proposal-status-label";
import proposalTitle from "../(utils)/proposal-title";
import ProposalCard from "./proposal-card";

type Props = {
    proposal_id: number;
};

/**
 * An MCP server, tool or skill the coordinator proposed (`proposalRef`): a chip
 * naming it and where it stands, which opens the card the super admin
 * confirms or rejects it from. Anyone it wasn't proposed to sees its
 * number only.
 */
export default function ProposalRefChip({ proposal_id }: Props) {
    const { view, loading, setView } = useExtensionProposal({ proposal_id });
    const [open, setOpen] = useState(false);

    const decided = (next: ExtensionProposalView) => {
        setView(next);
        setOpen(false);
    };

    if (!view) {
        return <Span className="font-bold">{loading ? `proposal ${proposal_id}` : `proposal ${proposal_id} (not available)`}</Span>;
    }

    const Icon = view.kind == "mcp" ? PlugZap : view.kind == "skill" ? BookOpen : Wrench;
    const title = proposalTitle({ view });
    const status = proposalStatusLabel({ view });

    return (
        <Modal
            target={
                <Button
                    type="button"
                    variant="outlined"
                    color="gray"
                    size="smaller"
                    title={`Review: ${title}`}
                    className="inline-flex h-6 gap-1.5! flex-nowrap align-middle px-2! text-[13px] font-bold text-ink whitespace-nowrap"
                >
                    <Icon size={14} aria-hidden className="shrink-0" />
                    {`${title} · ${status}`}
                </Button>
            }
            targetWrapperProps={{ className: "inline-flex align-middle" }}
            open={open}
            setOpen={setOpen}
            className="max-w-xl bg-paper p-6"
        >
            <Stack className="w-full gap-1! items-stretch">
                <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">{title}</H2>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {`${status}. The coordinator proposed this; nothing is saved until you confirm. Everything above the bot's own notes is read from what Confirm would save.`}
                </Span>
            </Stack>

            <Stack className="mt-2 max-h-[65vh] w-full gap-0! items-stretch overflow-y-auto">
                <ProposalCard view={view} onDecided={decided} />
            </Stack>
        </Modal>
    );
}
