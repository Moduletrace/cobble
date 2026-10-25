import Button from "@moduletrace/twui/layout/Button";
import type { ReactNode } from "react";

type Props = {
    title: string;
    aria_label: string;
    /**
     * Left out when a wrapper (a modal's target) handles the click.
     */
    onClick?: () => void;
    children: ReactNode;
};

/**
 * A small ghost icon button under a message, for its reply and reaction
 * actions. Quiet until hovered, and readable in both themes.
 */
export default function MessageActionButton({ title, aria_label, onClick, children }: Props) {
    return (
        <Button
            title={title}
            aria-label={aria_label}
            type="button"
            variant="ghost"
            color="text"
            onClick={onClick}
            className="shrink-0 p-1! -mx-1 text-ink-secondary dark:text-ink-secondary hover:text-ink rounded-default-xs focus-visible:ring-2 focus-visible:ring-ink"
        >
            {children}
        </Button>
    );
}
