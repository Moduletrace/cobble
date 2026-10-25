import Span from "@moduletrace/twui/layout/Span";
import type { ExtensionProposalView } from "@/src/types";
import MessageDetailsHeading from "./message-details-heading";
import ProposalEnvRow from "./proposal-env-row";

type Props = {
    view: ExtensionProposalView;
    /**
     * Every key it sends, once each.
     */
    keys: string[];
    /**
     * The keys that aren't saved yet.
     */
    missing: string[];
};

/**
 * Where a proposed server or tool sends from the app, and each key it
 * sends with whether it's saved.
 */
export default function ProposalReachSection({ view, keys, missing }: Props) {
    return (
        <>
            <MessageDetailsHeading>Where it sends</MessageDetailsHeading>
            <Span className="text-[14px] leading-5 font-bold text-ink break-all">
                {view.host || "Nothing from the app"}
            </Span>

            <MessageDetailsHeading>{`Keys it sends (${keys.length})`}</MessageDetailsHeading>
            {view.envs.length ? (
                view.envs.map((env) => <ProposalEnvRow key={`${env.key}-${env.where}`} env={env} />)
            ) : (
                <Span className="text-[13px] leading-5 text-ink-secondary">None.</Span>
            )}
            {missing.length ? (
                <Span className="mt-1 text-[12px] leading-4 text-ink-secondary">
                    {`Add missing keys in Settings, under Environment. Until then it's saved switched off.`}
                </Span>
            ) : null}
        </>
    );
}
