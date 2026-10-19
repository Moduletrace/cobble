import type { ComponentProps } from "react";
import Link from "@moduletrace/twui/layout/Link";
import { ComputerRefHrefPrefix } from "@/src/utils/link-computer-refs";
import ComputerRefChip from "./computer-ref-chip";

/**
 * A link in a bot message. A computer the bot named (`linkComputerRefs`)
 * becomes its switch button; anything else opens in a new tab.
 */
export default function MarkdownLink({ href, children }: ComponentProps<"a">) {
    if (href?.startsWith(ComputerRefHrefPrefix)) {
        const computer_id = Number(href.slice(ComputerRefHrefPrefix.length));

        if (computer_id) return <ComputerRefChip computer_id={computer_id} />;
    }

    return (
        <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline underline-offset-2 hover:opacity-80 break-words"
        >
            {children}
        </Link>
    );
}
