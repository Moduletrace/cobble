import Button from "@moduletrace/twui/layout/Button";
import { X } from "lucide-react";

type Props = {
    disabled?: boolean;
    onClick: () => void;
};

/**
 * Empties the input's text (the quote, the picked files and the draft it
 * saves stay where they are).
 */
export default function ComposerClearButton({ disabled, onClick }: Props) {
    return (
        <Button
            title={disabled ? "Nothing to clear" : "Clear the text"}
            aria-label="Clear the text"
            type="button"
            variant="ghost"
            color="text"
            disabled={disabled}
            onClick={onClick}
            className="shrink-0 p-1! -mx-1 my-1 text-ink dark:text-ink rounded-default-xs focus-visible:ring-2 focus-visible:ring-ink"
        >
            <X size={16} aria-hidden />
        </Button>
    );
}