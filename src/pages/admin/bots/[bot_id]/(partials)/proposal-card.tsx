import { useContext, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppContext } from "@/src/pages/__root";
import type { ExtensionProposalView } from "@/src/types";
import decideExtensionProposal from "../(functions)/decide-extension-proposal";
import sendBotMessage from "../(functions)/send-bot-message";
import proposalDecisionMessage from "../(utils)/proposal-decision-message";
import proposalExpiryLabel from "../(utils)/proposal-expiry-label";
import MessageDetailsHeading from "./message-details-heading";
import ProposalDetailRow from "./proposal-detail-row";
import ProposalReachSection from "./proposal-reach-section";
import ProposalSourceRow from "./proposal-source-row";

type Props = {
    view: ExtensionProposalView;
    onDecided: (view: ExtensionProposalView) => void;
};

/**
 * The confirm card for an MCP server, tool or skill the coordinator
 * proposed. Everything above the background check is read from what the
 * Confirm button saves (where it sends, every key and whether it's saved,
 * each detail; for a skill what its runbook points at and what changed);
 * the check is the bot's own words, labelled as such.
 * Deciding tells the bot in chat what happened.
 */
export default function ProposalCard({ view, onDecided }: Props) {
    const { pageProps } = useContext(AppContext);
    const [busy, setBusy] = useState<"confirm" | "reject">();
    const [error, setError] = useState<string>();

    const open = view.status == "pending" && !view.expired;
    const is_skill = view.kind == "skill";
    const missing = [...new Set(view.envs.filter((env) => !env.saved_in.length).map((env) => env.key))];
    const keys = [...new Set(view.envs.map((env) => env.key))];

    const decide = async (decision: "confirm" | "reject") => {
        const question =
            decision == "confirm" && is_skill
                ? `Save the skill ${view.name}? Every bot that loads it follows this runbook.`
                : decision == "confirm"
                  ? `Save ${view.name}?${keys.length ? ` It sends ${keys.join(", ")} to ${view.host}.` : ""}${missing.length ? ` It stays off until ${missing.join(", ")} ${missing.length == 1 ? "is" : "are"} added.` : ""}`
                  : `Reject ${view.name}? Nothing will be saved.`;

        if (!window.confirm(question)) return;

        setBusy(decision);
        setError(undefined);

        const res = await decideExtensionProposal({ proposal_id: view.id, decision }).catch(() => null);

        if (!res?.success || !res.singleRes) {
            setBusy(undefined);
            setError(res?.msg || `Couldn't ${decision} it.`);
            return;
        }

        onDecided(res.singleRes);

        await sendBotMessage({
            bot_id: Number(pageProps?.bot?.id) || 0,
            workspace_id: pageProps?.workspace?.id || null,
            text: proposalDecisionMessage({ view: res.singleRes }),
            media_ids: [],
        }).catch(() => null);

        setBusy(undefined);
    };

    return (
        <Stack className="w-full gap-0! items-stretch">
            {is_skill ? null : <ProposalReachSection view={view} keys={keys} missing={missing} />}

            <MessageDetailsHeading>What would be saved</MessageDetailsHeading>
            {view.details.map((detail) => (
                <ProposalDetailRow key={detail.label} {...detail} />
            ))}

            <MessageDetailsHeading>
                {is_skill ? "Review (written by the bot)" : "Background check (written by the bot)"}
            </MessageDetailsHeading>
            <Span className="whitespace-pre-wrap text-[13px] leading-5 text-ink break-words">{view.research}</Span>
            <Stack className="mt-1 w-full gap-0! items-stretch">
                {view.sources.length ? (
                    view.sources.map((url) => <ProposalSourceRow key={url} url={url} />)
                ) : (
                    <Span className="text-[12px] leading-4 text-ink-secondary">No pages given.</Span>
                )}
            </Stack>

            {view.outcome ? (
                <Span className="mt-4 text-[13px] leading-5 text-ink">{view.outcome}</Span>
            ) : null}

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
                        title={`Reject ${view.name}: nothing is saved`}
                        loading={busy == "reject"}
                        disabled={Boolean(busy)}
                        onClick={() => decide("reject")}
                    >
                        Reject
                    </Button>
                    <Button
                        type="button"
                        size="small"
                        title={`Save ${view.name}`}
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
