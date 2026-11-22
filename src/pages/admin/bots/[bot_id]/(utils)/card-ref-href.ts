import { ConnectRefHrefPrefix, HookProposalRefHrefPrefix, ProposalRefHrefPrefix, SecretRequestRefHrefPrefix } from "@/src/utils/link-computer-refs";
import { botPlanRefId } from "@/src/utils/bot-plan-ref";
import { botQuestionRefId } from "@/src/utils/bot-question-ref";

/**
 * Whether a ref link stands for a card shown in full under the message (a
 * plan, questions, a proposal, a hook proposal, a secret request) rather
 * than a chip on the line. Those cards are blocks, so the message's
 * paragraph has to lift them out of itself (React refuses a block inside a
 * `p`).
 */
export function isCardRefHref({ href }: { href?: string }): boolean {
    if (!href) return false;

    return Boolean(
        botPlanRefId({ href }) ||
            botQuestionRefId({ href }) ||
            href.startsWith(ProposalRefHrefPrefix) ||
            href.startsWith(HookProposalRefHrefPrefix) ||
            href.startsWith(SecretRequestRefHrefPrefix) ||
            href.startsWith(ConnectRefHrefPrefix),
    );
}