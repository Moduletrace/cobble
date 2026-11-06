import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import type { LucideIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

export type ImageViewerTool = {
    id: string;
    icon: LucideIcon;
    /**
     * What it does, with its key, for the tooltip and screen readers.
     */
    title: string;
    /**
     * Shown beside the icon on wider screens; icon only without one.
     */
    label?: string;
    pressed?: boolean;
    disabled?: boolean;
    onClick: () => void;
};

/**
 * One control on the image preview's toolbar: a zoom, or a preset that
 * shows as pressed while it is the one in use.
 */
export default function ImageViewerToolButton({ icon: Icon, title, label, pressed, disabled, onClick }: ImageViewerTool) {
    return (
        <Button
            type="button"
            variant="ghost"
            color="gray"
            size="small"
            title={title}
            aria-label={title}
            aria-pressed={pressed}
            disabled={disabled}
            onClick={onClick}
            className={twMerge("gap-1.5! text-ink-secondary hover:text-ink", pressed && "bg-ink/5 text-ink")}
        >
            <Icon size={16} aria-hidden />
            {label ? <Span className="hidden sm:inline text-[13px] leading-[18px]">{label}</Span> : null}
        </Button>
    );
}
