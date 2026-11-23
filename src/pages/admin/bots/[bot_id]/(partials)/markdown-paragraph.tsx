import { Children, isValidElement, type ReactNode } from "react";
import P from "@moduletrace/twui/layout/P";
import Stack from "@moduletrace/twui/layout/Stack";
import { isCardRefHref } from "../(utils)/card-ref-href";

const TextClassName = "w-full text-sm leading-5 text-ink";

/**
 * A paragraph of a bot message. A card ref (a plan, questions, a proposal,
 * a hook proposal, a secret request, a take-over) is a block, which React
 * refuses inside a `p`, so the paragraph is split around it: the text stays
 * in paragraphs and each card gets a line of its own, still in the message's
 * reading order.
 */
export default function MarkdownParagraph({ children }: { children?: ReactNode }) {
    const nodes = Children.toArray(children);

    if (!nodes.some(isCardElement)) {
        return (
            <P noMargin className={TextClassName}>
                {children}
            </P>
        );
    }

    const blocks: ReactNode[] = [];
    let line: ReactNode[] = [];

    const flush = () => {
        const kept = line.filter((node) => typeof node != "string" || node.trim());

        if (kept.length) {
            blocks.push(
                <P key={`line-${blocks.length}`} noMargin className={TextClassName}>
                    {kept}
                </P>,
            );
        }

        line = [];
    };

    nodes.forEach((node, index) => {
        if (isCardElement(node)) {
            flush();
            blocks.push(
                <Stack key={`card-${index}`} className="w-full items-stretch">
                    {node}
                </Stack>,
            );
            return;
        }

        line.push(node);
    });

    flush();

    return <Stack className="w-full gap-1! items-stretch">{blocks}</Stack>;
}

function isCardElement(node: ReactNode): boolean {
    if (!isValidElement(node)) return false;

    const href = (node.props as { href?: unknown }).href;

    return typeof href == "string" && isCardRefHref({ href });
}