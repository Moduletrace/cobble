import Span from "@moduletrace/twui/layout/Span";
import relativeTime from "@/src/utils/relative-time";

export default function GroupTimestamp({ at }: { at: number }) {
    return (
        <Span className="text-[11px] leading-4 text-ink-secondary">
            {relativeTime({ at })}
        </Span>
    );
}
