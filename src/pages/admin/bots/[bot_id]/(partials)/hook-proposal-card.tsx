import { useContext, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import HookUrlNotice from "@/src/components/general/hook-url-notice";
import { AppContext } from "@/src/pages/__root";
import type { HookProposalView } from "@/src/types";
import decideHookProposal from "../(functions)/decide-hook-proposal";
import sendBotMessage from "../(functions)/send-bot-message";
import hookProposalDecisionMessage from "../(utils)/hook-proposal-decision-message";
import proposalExpiryLabel from "../(utils)/proposal-expiry-label";
import MessageDetailsHeading from "./message-details-heading";
import ProposalDetailRow from "./proposal-detail-row";

type Props = {
    view: HookProposalView;
    onDecided: (view: HookProposalView) => void;
    /**
     * The user is done with the card (after deciding, or after copying a
     * new hook's URL).
     */
    onDone: () => void;
};

/**
 * The confirm card for a hook a bot proposed. Everything above the bot's
 * reason is read from what Confirm saves (what calls it, where it runs,
 * the whole brief; for a change each field as it is and would be).
 * Confirming a new hook called at a URL shows that URL here, once: the
 * bot never gets it. Deciding tells the bot in chat what happened.
 */
export default function HookProposalCard({ view, onDecided, onDone }: Props) {
    const { pageProps } = useContext(AppContext);
    const [busy, setBusy] = useState<"confirm" | "reject">();
    const [error, setError] = useState<string>();
    const [token, setToken] = useState<string>();

    const open = view.status == "pending" && !view.expired;

    const decide = async (decision: "confirm" | "reject") => {
        const question =
            decision == "reject"
                ? `Reject this hook? Nothing will be saved.`
                : view.action == "create"
                  ? `Add the hook ${view.title}? Each call runs its brief for ${view.bot_name} on its own, as you.`
                  : `Change the hook ${view.title}?`;

        if (!window.confirm(question)) return;

        setBusy(decision);
        setError(undefined);

        const res = await decideHookProposal({ proposal_id: view.id, decision }).catch(() => null);

        if (!res?.success || !res.singleRes) {
            setBusy(undefined);
            setError(res?.msg || `Couldn't ${decision} it.`);
            return;
        }

        setToken(res.singleRes.token);
        onDecided(res.singleRes.view);

        await sendBotMessage({
            bot_id: Number(pageProps?.bot?.id) || 0,
            workspace_id: pageProps?.workspace?.id || null,
            text: hookProposalDecisionMessage({ view: res.singleRes.view }),
            media_ids: [],
        }).catch(() => null);

        setBusy(undefined);

        if (!res.singleRes.token) onDone();
    };

    if (token) return <HookUrlNotice token={token} onDone={onDone} />;

    return (
        <Stack className="w-full gap-0! items-stretch">
            <MessageDetailsHeading>What would be saved</MessageDetailsHeading>
            {view.details.map((detail) => (
                <ProposalDetailRow key={detail.label} {...detail} />
            ))}
            {view.makes_url ? (
                <Span className="mt-1 text-[12px] leading-4 text-ink-secondary">
                    {`Its URL is shown here once you confirm, to you only. To require signed calls, add a signing secret from the Hooks menu afterwards.`}
                </Span>
            ) : null}

            <MessageDetailsHeading>Why (written by the bot)</MessageDetailsHeading>
            <Span className="whitespace-pre-wrap text-[13px] leading-5 text-ink break-words">{view.reason}</Span>

            {view.outcome ? <Span className="mt-4 text-[13px] leading-5 text-ink">{view.outcome}</Span> : null}

            {error ? <Span className="mt-2 text-[13px] leading-5 text-ink">{error}</Span> : null}

            {open ? (
                <Row className="mt-5 w-full gap-2! justify-end">
                    <Span className="grow text-[12px] leading-4 text-ink-secondary">
                        {proposalExpiryLabel({ expires_at: view.expires_at })}
                    </Span>
                    <Button
                        type="button"
                        variant="outlined"
                        color="gray"
                        size="small"
                        title={`Reject the hook ${view.title}: nothing is saved`}
                        loading={busy == "reject"}
                        disabled={Boolean(busy)}
                        onClick={() => decide("reject")}
                    >
                        Reject
                    </Button>
                    <Button
                        type="button"
                        size="small"
                        title={`Save the hook ${view.title}`}
                        loading={busy == "confirm"}
                        disabled={Boolean(busy)}
                        onClick={() => decide("confirm")}
                    >
                        Confirm
                    </Button>
                </Row>
            ) : null}
        </Stack>
    );
}
