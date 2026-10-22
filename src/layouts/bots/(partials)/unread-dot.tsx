import Span from "@moduletrace/twui/layout/Span";

type Props = {
    /**
     * The bot's colour (`#rrggbb`), painted straight onto the dot: a free
     * colour has no token to point at, so it's a fill attribute here rather
     * than a `bg-*` class.
     */
    color: string;
};

/**
 * The unread marker on a rail row. It keeps the bot's colour rather than
 * an accent, and it never replaces the snippet or time.
 */
export default function UnreadDot({ color }: Props) {
    return (
        <Span className="shrink-0" aria-label="Unread" role="img">
            <svg width={6} height={6} viewBox="0 0 6 6" aria-hidden="true">
                <circle cx={3} cy={3} r={3} fill={color} />
            </svg>
        </Span>
    );
}
