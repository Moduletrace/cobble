import Button from "@moduletrace/twui/layout/Button";
import { ArrowDown } from "lucide-react";

type Props = {
    onClick: () => void;
};

/**
 * "Jump to latest", floating over the bottom of the thread while it sits
 * above it: a bot's reply that landed out of sight, or a long scroll back
 * through the conversation.
 */
export default function ScrollToBottomButton({ onClick }: Props) {
    return (
        <Button
            type="button"
            color="secondary"
            title="Jump to the latest message"
            aria-label="Jump to the latest message"
            variant="outlined"
            onClick={onClick}
            className="absolute bottom-3 left-1/2 z-20 shrink-0 -translate-x-1/2 gap-1.5! px-2.5! py-1.5! rounded-default-sm border border-solid border-hairline bg-surface shadow-popover text-xs font-bold text-ink hover:bg-sunken focus-visible:ring-2 focus-visible:ring-ink"
        >
            <ArrowDown size={13} aria-hidden />
            Jump to latest
        </Button>
    );
}
