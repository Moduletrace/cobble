import type { ReactNode } from "react";
import Button from "@moduletrace/twui/layout/Button";

type Props = {
    title: string;
    active: boolean;
    onClick: () => void;
    children: ReactNode;
};

/**
 * One formatting toggle in the composer's selection bubble.
 */
export default function ComposerFormatButton({ title, active, onClick, children }: Props) {
    return (
        <Button
            type="button"
            variant="ghost"
            color="text"
            title={title}
            aria-label={title}
            aria-pressed={active}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            className={`shrink-0 p-1.5! rounded-default-xs ${active ? "bg-sunken text-ink" : "text-ink-secondary hover:text-ink"}`}
        >
            {children}
        </Button>
    );
}
