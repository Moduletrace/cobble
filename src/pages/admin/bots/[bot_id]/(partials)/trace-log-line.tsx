import Popover from "@moduletrace/twui/elements/Popover";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { twMerge } from "tailwind-merge";
import type { BotTraceRow } from "@/src/types";
import traceEntryView from "../(utils)/trace-entry-view";
import TraceHoverDetails from "./trace-hover-details";

type Props = {
    entry: BotTraceRow;
};

/**
 * One line of the debug logs under the thinking row: what the run just did,
 * in the order it did it. Turn, tool and event names are fixed-width, so a
 * stream of them reads as a column, and the detail is cut to the line.
 *
 * Hovering the line opens the step whole (`TraceHoverDetails`): what the
 * model reasoned and wrote, what the tool was sent and what it answered,
 * which is more than a line can say and more than the running strip should
 * spend its height on.
 *
 * It is read by leaving the line and entering the card, so the card sits
 * against the line (`-mb-2` cancels the 8px gap twui leaves above a target)
 * and stays up for `debounce` after the pointer leaves either of them, long
 * enough to cross over. That delay is the closing one: twui opens on enter.
 */
export default function TraceLogLine({ entry }: Props) {
    const view = traceEntryView({ entry });
    const preview = (view.text || view.result || view.arguments || "").replace(/\s+/g, " ").trim();

    return (
        <Popover
            trigger="hover"
            position="top"
            debounce={600}
            targetWrapperProps={{ className: "w-full shrink-0" }}
            target={
                <Row
                    className={twMerge(
                        "w-full flex-nowrap items-baseline gap-2! py-0.5",
                        view.failed && "text-ink",
                    )}
                >
                    <Span
                        className={twMerge(
                            "shrink-0 w-[86px] truncate text-[11px] leading-4 text-ink-disabled",
                            view.failed && "text-ink-secondary",
                        )}
                    >
                        {view.title}
                    </Span>
                    <Span className="min-w-0 grow truncate text-xs leading-4 text-ink-secondary">
                        {preview || "-"}
                    </Span>
                    {view.duration ? (
                        <Span className="shrink-0 text-[11px] leading-4 text-ink-disabled">
                            {view.duration}
                        </Span>
                    ) : null}
                </Row>
            }
            className="w-[440px] max-w-[92vw] max-h-[320px] -mb-2 overflow-y-auto p-3 gap-2! bg-surface dark:bg-surface border-hairline dark:border-hairline rounded-default shadow-popover"
        >
            <TraceHoverDetails entry={entry} />
        </Popover>
    );
}