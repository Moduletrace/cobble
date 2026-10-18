import P from "@moduletrace/twui/layout/P";

/**
 * Ink bubble with paper text; inverts in dark mode.
 */
export default function UserBubble({ text }: { text: string }) {
    return (
        <P noMargin className="max-w-[80%] rounded-default-lg bg-ink text-on-ink px-4 py-3 text-sm leading-5 whitespace-pre-wrap break-words">
            {text}
        </P>
    );
}
