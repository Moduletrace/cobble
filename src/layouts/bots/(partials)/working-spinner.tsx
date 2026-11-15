import Span from "@moduletrace/twui/layout/Span";

type Props = {
    /**
     * The bot's colour (`#rrggbb`), painted straight onto the turning arc:
     * a free colour has no token to point at, so it's a stroke attribute
     * here rather than a `stroke-*` class. The coordinator has no colour, so
     * its arc takes the row's ink.
     */
    color?: string | null;
};

/**
 * A working bot's spinner, in the rail row's time slot: it turns while the
 * bot has work running and says nothing about what that work is (the status
 * line under the name does). A stone is never given a ring or a badge, so
 * this sits beside it rather than on it. Its track is the hairline, not a
 * hue: the bot's colour is its identity, and the movement is the state.
 */
export default function WorkingSpinner({ color }: Props) {
    return (
        <Span role="img" aria-label="Working" className="shrink-0 inline-flex">
            <svg
                width={12}
                height={12}
                viewBox="0 0 12 12"
                aria-hidden="true"
                className="animate-spin motion-reduce:animate-none"
            >
                <circle
                    cx={6}
                    cy={6}
                    r={4.5}
                    fill="none"
                    strokeWidth={1.5}
                    className="stroke-hairline-strong opacity-40"
                />
                <path
                    d="M6 1.5A4.5 4.5 0 0 1 10.5 6"
                    fill="none"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    stroke={color || "currentColor"}
                />
            </svg>
        </Span>
    );
}