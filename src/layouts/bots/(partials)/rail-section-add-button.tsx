import Button from "@moduletrace/twui/layout/Button";
import { Plus } from "lucide-react";

type Props = {
    title: string;
    onClick: () => void;
};

/**
 * The "+" beside a rail section's label.
 */
export default function RailSectionAddButton({ title, onClick }: Props) {
    return (
        <Button
            title={title}
            aria-label={title}
            type="button"
            variant="ghost"
            color="text"
            onClick={onClick}
            className="size-6 p-0! rounded-default-sm text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken focus-visible:ring-2 focus-visible:ring-ink"
        >
            <Plus size={14} aria-hidden />
        </Button>
    );
}
