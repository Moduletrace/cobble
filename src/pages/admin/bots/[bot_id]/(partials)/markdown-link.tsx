import type { ComponentProps } from "react";
import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import { QuoteInlineAttribute } from "../(utils)/quotable-text";
import refChipForHref from "../(utils)/ref-chip-for-href";

/**
 * A link in a bot message. A ref the bot wrote becomes its chip
 * (`refChipForHref`), marked so a quote reads it as one inline label
 * (`quotableText`); anything else opens in a new tab.
 */
export default function MarkdownLink({ href, children }: ComponentProps<"a">) {
    const chip = refChipForHref({ href });

    if (chip) {
        return (
            <Span {...{ [QuoteInlineAttribute]: "" }}>
                {chip}
            </Span>
        );
    }

    return (
        <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline underline-offset-2 hover:opacity-80 wrap-anywhere"
        >
            {children}
        </Link>
    );
}
