"use client";

import type { ReactNode } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import { twMerge } from "tailwind-merge";

type Props = {
    /** Which edge it slides in from. */
    side: "left" | "right";
    open: boolean;
    onClose: () => void;
    /** What it holds, for a screen reader. */
    label: string;
    className?: string;
    backdropClassName?: string;
    /**
     * Whether the closed panel is hidden from screen readers and untabbed.
     * On, unless the panel is also a permanent part of the page (`false`
     * for the rail, which is the inline rail from `md` up).
     */
    inertWhenClosed?: boolean;
    children: ReactNode;
};

const Edges = {
    left: { place: "left-0 border-r", closed: "-translate-x-full" },
    right: { place: "right-0 border-l", closed: "translate-x-full" },
};

/**
 * A panel that slides in from an edge over the page, with a dimmed backdrop
 * that closes it. Panel and backdrop are always mounted, as the rail is, so
 * the panel slides both ways instead of appearing and vanishing: nothing has
 * to wait on a timer for an exit to play.
 *
 * The panel carries `data-no-swipe`, so a phone's sideways swipes never
 * start on it or on its backdrop: what is open stays the one on top.
 */
export default function SidePanel({
    side,
    open,
    onClose,
    label,
    className,
    backdropClassName,
    inertWhenClosed = true,
    children,
}: Props) {
    const edge = Edges[side];
    const hidden = !open && inertWhenClosed;

    return (
        <>
            {open ? (
                <Stack
                    aria-hidden
                    data-no-swipe
                    onClick={onClose}
                    className={twMerge("fixed inset-0 z-30 bg-ink/40", backdropClassName)}
                />
            ) : null}
            <Stack
                aria-label={label}
                aria-hidden={hidden || undefined}
                inert={hidden}
                data-no-swipe
                className={twMerge(
                    "fixed inset-y-0 z-40 w-[280px] max-w-[85vw] shrink-0 h-full gap-0! items-stretch bg-paper border-0 border-solid border-hairline shadow-popover transition-transform duration-[var(--m-base)] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
                    edge.place,
                    open ? "translate-x-0" : edge.closed,
                    className,
                )}
            >
                {children}
            </Stack>
        </>
    );
}