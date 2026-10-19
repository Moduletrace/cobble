import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { Check, CircleAlert, CircleDashed } from "lucide-react";
import Row from "@moduletrace/twui/layout/Row";

type Props = {
    state: "ok" | "error" | "untested";
    /**
     * The status in words, e.g. "Connected · 12 tools · checked 5m ago".
     */
    text: string;
    /**
     * What went wrong, under it.
     */
    error?: string;
};

/**
 * Whether an MCP server connects or a tool works, under its row. Said in
 * words with an icon, never with color alone.
 */
export default function ExtensionStatusLine({ state, text, error }: Props) {
    const Icon = state == "ok" ? Check : state == "error" ? CircleAlert : CircleDashed;

    return (
        <Stack role="status" className="w-full gap-0.5! items-stretch pl-14 pr-3 pb-2.5 -mt-1">
            <Row className="gap-1.5! flex-nowrap items-center">
                <Icon size={14} aria-hidden className="shrink-0" />
                <Span className="text-[13px] leading-[18px] text-ink">{text}</Span>
            </Row>
            {error ? (
                <Span
                    title={error}
                    className="text-[13px] leading-[18px] text-ink-secondary whitespace-pre-wrap break-words line-clamp-3"
                >
                    {error}
                </Span>
            ) : null}
        </Stack>
    );
}
