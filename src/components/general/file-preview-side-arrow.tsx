import Button from "@moduletrace/twui/layout/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { twMerge } from "tailwind-merge";

type Props = {
    side: "previous" | "next";
    disabled?: boolean;
    onClick: () => void;
};

/**
 * One of the preview's side arrows, over the far middle left or right of
 * the shown file: Previous or Next through the gallery, the same step the
 * header's stepper and the arrow keys make.
 */
export default function FilePreviewSideArrow({ side, disabled, onClick }: Props) {
    const previous = side == "previous";
    const Icon = previous ? ChevronLeft : ChevronRight;
    const label = previous ? "Previous image" : "Next image";

    return (
        <Button
            type="button"
            variant="outlined"
            color="secondary"
            title={`${label} (arrow key)`}
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={twMerge(
                "absolute top-1/2 z-20 shrink-0 -translate-y-1/2 rounded-full border border-solid border-hairline bg-surface p-2! shadow-popover text-ink hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ink disabled:cursor-not-allowed disabled:opacity-50",
                previous ? "left-3" : "right-3",
            )}
        >
            <Icon size={20} aria-hidden />
        </Button>
    );
}
