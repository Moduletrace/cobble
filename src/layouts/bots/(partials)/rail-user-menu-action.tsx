"use client";

import type { LucideIcon } from "lucide-react";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";

type Props = {
    title: string;
    Icon: LucideIcon;
    onClick: () => void;
    disabled?: boolean;
};

/**
 * A popover item that acts rather than navigates, e.g. Install app.
 */
export default function RailUserMenuAction({
    title,
    Icon,
    onClick,
    disabled,
}: Props) {
    return (
        <Row
            role="menuitem"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            title={title}
            onClick={() => {
                if (!disabled) onClick();
            }}
            onKeyDown={(event) => {
                if (disabled) return;
                if (event.key == "Enter" || event.key == " ") {
                    event.preventDefault();
                    onClick();
                }
            }}
            className={`w-full h-9 gap-2.5! flex-nowrap items-center px-4 ${
                disabled
                    ? "text-ink-disabled cursor-not-allowed"
                    : "text-ink cursor-pointer hover:bg-sunken transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink"
            }`}
        >
            <Icon size={16} aria-hidden />
            <Span className="text-sm leading-5">{title}</Span>
        </Row>
    );
}
