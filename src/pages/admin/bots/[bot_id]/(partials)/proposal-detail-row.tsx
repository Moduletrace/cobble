import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { twMerge } from "tailwind-merge";
import type { ExtensionProposalDetail } from "@/src/types";

/**
 * One line of what a proposed server or tool would do, as the app read it
 * from the config: a label, and its value, code-like ones as a block.
 */
export default function ProposalDetailRow({ label, value, block }: ExtensionProposalDetail) {
    return (
        <Row className="w-full py-2 gap-3! flex-nowrap items-baseline border-0 border-b border-solid border-hairline last:border-b-0">
            <Span className="w-28 shrink-0 text-[12px] leading-4 text-ink-secondary">{label}</Span>
            <Span
                className={twMerge(
                    "grow min-w-0 text-[13px] leading-5 text-ink break-words",
                    block && "max-h-48 overflow-auto whitespace-pre-wrap rounded-default-xs bg-sunken px-2 py-1 font-mono text-[12px]",
                )}
            >
                {value}
            </Span>
        </Row>
    );
}
