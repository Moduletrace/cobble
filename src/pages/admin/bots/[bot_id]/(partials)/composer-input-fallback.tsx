import Span from "@moduletrace/twui/layout/Span";

/**
 * Holds the editor's place, the same size, while it loads.
 */
export default function ComposerInputFallback({ placeholder }: { placeholder: string }) {
    return (
        <Span className="grow min-w-0 self-center min-h-5 text-sm leading-5 text-ink-secondary truncate">
            {placeholder}
        </Span>
    );
}
