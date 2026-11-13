import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import type { ToolRollupEntry } from "@/src/utils/tool-rollup";

type Props = {
    tool: ToolRollupEntry;
};

/**
 * One tool in a message's rollup: its name as the run called it, what the
 * app calls that, and how many calls it made, of which how many failed.
 */
export default function MessageToolRow({ tool }: Props) {
    return (
        <Row className="w-full py-1.5 gap-3! flex-nowrap items-baseline border-0 border-b border-solid border-hairline last:border-b-0">
            <Span
                className="grow min-w-0 font-mono text-[12px] leading-4 text-ink truncate"
                title={`${tool.label} (${tool.name})`}
            >
                {tool.name}
            </Span>
            <Span className="shrink-0 text-[11px] leading-4 text-ink-secondary tabular-nums">{tool.label}</Span>
            <Span className="shrink-0 text-[12px] leading-4 text-ink-secondary tabular-nums">
                {tool.count == 1 ? "1 call" : `${tool.count} calls`}
            </Span>
            {tool.failed ? (
                <Span className="w-14 shrink-0 text-right text-[11px] leading-4 text-ink-secondary tabular-nums">
                    {`${tool.failed} failed`}
                </Span>
            ) : null}
        </Row>
    );
}