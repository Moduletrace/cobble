import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { useState } from "react";
import { AppData } from "@/src/data/app-data";
import { BotHookEventStatuses } from "@/src/dict/bot-hook-dict";
import useHookCall from "@/src/hooks/use-hook-call";
import type { BotHookCall } from "@/src/types";
import relativeTime from "@/src/utils/relative-time";
import HookCallText from "./hook-call-text";

type Props = {
    event: BotHookCall;
};

/**
 * One call to a hook: what became of it and when, where it came from, why
 * it was refused, then what it sent and what its run answered. Previews
 * at first; Show all loads the whole call.
 */
export default function HookEventRow({ event }: Props) {
    const [open, set_open] = useState(false);
    const { call, loading, error } = useHookCall({ event_id: Number(event.id), open });
    const shown = open && call ? call : event;

    const status = BotHookEventStatuses.find((s) => s.value == event.status)?.title || event.status || "";
    const meta = [
        `#${event.id}`,
        status,
        event.created_at ? relativeTime({ at: Number(event.created_at) }) : "",
        event.source_ip || "",
        event.job_id ? `job #${event.job_id}` : "",
        event.error || "",
    ]
        .filter(Boolean)
        .join(" · ");

    const cut =
        String(event.payload || "").length >= AppData.BotHookCallPreviewChars ||
        String(event.response || "").length >= AppData.BotHookCallPreviewChars;

    return (
        <Stack className="w-full gap-1! items-stretch px-3 py-2">
            <Row className="w-full gap-2! flex-nowrap">
                <Span className="grow text-xs font-bold leading-4 text-ink truncate">{meta}</Span>
                {cut ? (
                    <Button
                        title={open ? "Show the start only" : "Show the whole call"}
                        type="button"
                        variant="ghost"
                        color="gray"
                        size="small"
                        loading={loading}
                        onClick={() => set_open((value) => !value)}
                        className="shrink-0 px-2! text-[12px]"
                    >
                        {open ? "Less" : "Show all"}
                    </Button>
                ) : null}
            </Row>
            {shown.payload ? <HookCallText label="Sent" text={String(shown.payload)} full={open && Boolean(call)} /> : null}
            {shown.response ? (
                <HookCallText
                    label={event.status == "failed" ? "Run failed" : "Answered"}
                    text={String(shown.response)}
                    full={open && Boolean(call)}
                />
            ) : null}
            {error ? <Span className="text-xs leading-4 text-ink-secondary">{error}</Span> : null}
        </Stack>
    );
}
