import { useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import Button from "@moduletrace/twui/layout/Button";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { Webhook } from "lucide-react";
import useHookProposal from "../(hooks)/use-hook-proposal";
import hookProposalTitle from "../(utils)/hook-proposal-title";
import proposalStatusLabel from "../(utils)/proposal-status-label";
import HookProposalCard from "./hook-proposal-card";

type Props = {
    proposal_id: number;
};

/**
 * A hook a bot proposed (`hookProposalRef`): a chip naming it and where
 * it stands, which opens the card the user confirms or rejects it from.
 * Anyone it wasn't proposed to sees its number only.
 */
export default function HookProposalRefChip({ proposal_id }: Props) {
    const { view, loading, setView } = useHookProposal({ proposal_id });
    const [open, setOpen] = useState(false);

    if (!view) {
        return (
            <Span className="font-bold">
                {loading ? `hook proposal ${proposal_id}` : `hook proposal ${proposal_id} (not available)`}
            </Span>
        );
    }

    const title = hookProposalTitle({ view });
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
                    <Webhook size={14} aria-hidden className="shrink-0" />
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
                    {`${status}. ${view.bot_name} proposed this; nothing is saved until you confirm. Everything above the bot's own words is read from what Confirm would save.`}
                </Span>
            </Stack>

            <Stack className="mt-2 max-h-[65vh] w-full gap-0! items-stretch overflow-y-auto">
                <HookProposalCard view={view} onDecided={setView} onDone={() => setOpen(false)} />
            </Stack>
        </Modal>
    );
}
