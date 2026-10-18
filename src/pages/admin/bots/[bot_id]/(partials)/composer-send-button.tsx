import Button from "@moduletrace/twui/layout/Button";
import { ArrowUp } from "lucide-react";

type Props = {
    disabled?: boolean;
    loading?: boolean;
    onClick: () => void;
};

/**
 * 32px ink send button with a paper arrow.
 */
export default function ComposerSendButton({ disabled, loading, onClick }: Props) {
    return (
        <Button
            title="Send"
            disabled={disabled}
            loading={loading}
            loadingIconSize="smaller"
            onClick={onClick}
            className="shrink-0 size-8 p-0! rounded-default focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
            <ArrowUp size={16} aria-hidden />
        </Button>
    );
}
