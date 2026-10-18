import Span from "@moduletrace/twui/layout/Span";

/**
 * Belongs to the message, never the avatar.
 */
export default function NeedsYouChip() {
    return (
        <Span className="inline-flex h-5 items-center px-3 rounded-default-xs bg-sunken text-[11px] font-bold leading-4 text-ink">
            Needs you
        </Span>
    );
}
