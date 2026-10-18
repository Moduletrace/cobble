import Button from "@moduletrace/twui/layout/Button";
import { Plus } from "lucide-react";

/**
 * Attachments are not designed yet; the control is present but inert.
 */
export default function ComposerAttachButton() {
    return (
        <Button
            title="Attachments are not available yet"
            variant="ghost"
            color="text"
            aria-disabled="true"
            className="shrink-0 p-1! -m-1 text-ink dark:text-ink cursor-not-allowed rounded-default-xs focus-visible:ring-2 focus-visible:ring-ink"
        >
            <Plus size={16} aria-hidden />
        </Button>
    );
}
