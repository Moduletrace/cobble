import Button from "@moduletrace/twui/layout/Button";
import type { LucideIcon } from "lucide-react";

type Props = {
    icon: LucideIcon;
    /**
     * Says what the button does; it has no visible label.
     */
    title: string;
    disabled?: boolean;
    loading?: boolean;
};

/**
 * A ghost icon button on the right of the conversation header. Used as a
 * modal's target, so it takes no click handler of its own.
 */
export default function HeaderIconButton({ icon: Icon, title, disabled, loading }: Props) {
    return (
        <Button
            title={title}
            aria-label={title}
            type="button"
            variant="ghost"
            color="text"
            disabled={disabled}
            loading={loading}
            className="shrink-0 p-2! text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken rounded-default transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink"
        >
            <Icon size={18} aria-hidden />
        </Button>
    );
}
