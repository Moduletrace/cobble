import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import P from "@moduletrace/twui/layout/P";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import SunkenCodeBlock from "@/src/components/general/sunken-code-block";
import { TracePreviewChars } from "../(utils)/trace-entry-view";

type Props = {
    /**
     * What the text is (why it reasoned, what it was sent, what it
     * answered), shown above it.
     */
    label?: string;
    text: string;
    /**
     * Tool arguments and answers are code, so they keep their line breaks
     * and monospace; an answer or a note reads as prose.
     */
    kind?: "text" | "code";
};

/**
 * One block of text in a trace entry, cut after `TracePreviewChars` with a
 * way to open the rest: a tool's answer can be thousands of characters,
 * most of which nobody reads in a panel.
 */
export default function TraceBlock({ label, text, kind = "text" }: Props) {
    const [expanded, setExpanded] = useState(false);
    const long = text.length > TracePreviewChars;
    const shown = long && !expanded ? `${text.slice(0, TracePreviewChars)}` : text;

    return (
        <Stack className="w-full gap-1 items-stretch">
            {label ? (
                <Span className="text-[11px] uppercase tracking-wide text-ink-secondary">
                    {label}
                </Span>
            ) : null}
            {kind == "code" ? (
                <SunkenCodeBlock wrapAnywhere>{shown}</SunkenCodeBlock>
            ) : (
                <P className="py-0 whitespace-pre-wrap text-[13px] leading-5 text-ink">{shown}</P>
            )}
            {long ? (
                <Row className="w-full items-center gap-2">
                    <Button
                        title={expanded ? "Show less" : "Show the whole text"}
                        type="button"
                        variant="ghost"
                        color="gray"
                        size="smaller"
                        onClick={() => setExpanded((open) => !open)}
                    >
                        {expanded
                            ? "Show less"
                            : `Show all ${text.length.toLocaleString()} characters`}
                    </Button>
                </Row>
            ) : null}
        </Stack>
    );
}