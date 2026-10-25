import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { BUN_SQLITE_COBBLE_BOT_HOOK_EVENTS } from "@/db/types/db";
import { BotHookEventStatuses } from "@/src/dict/bot-hook-dict";
import relativeTime from "@/src/utils/relative-time";

type Props = {
    event: BUN_SQLITE_COBBLE_BOT_HOOK_EVENTS;
};

/**
 * One call to a hook: what became of it and when, where it came from, why
 * it was refused, and the start of what it sent.
 */
export default function HookEventRow({ event }: Props) {
    const status = BotHookEventStatuses.find((s) => s.value == event.status)?.title || event.status || "";
    const meta = [
        status,
        event.created_at ? relativeTime({ at: Number(event.created_at) }) : "",
        event.source_ip || "",
        event.job_id ? `job #${event.job_id}` : "",
        event.error || "",
    ]
        .filter(Boolean)
        .join(" · ");

    return (
        <Stack className="w-full gap-1! items-stretch px-3 py-2">
            <Row className="w-full gap-2! flex-nowrap">
                <Span className="text-xs font-bold leading-4 text-ink truncate">{meta}</Span>
            </Row>
            {event.payload ? (
                <Span className="block w-full max-h-24 overflow-hidden whitespace-pre-wrap break-all rounded-default-xs bg-sunken px-2 py-1 font-mono text-[12px] leading-4 text-ink-secondary">
                    {event.payload}
                </Span>
            ) : null}
        </Stack>
    );
}
