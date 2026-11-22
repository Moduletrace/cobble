import Button from "@moduletrace/twui/layout/Button";
import Card from "@moduletrace/twui/elements/Card";
import Span from "@moduletrace/twui/layout/Span";
import { TriangleAlert, X } from "lucide-react";
import { twMerge } from "tailwind-merge";

type Props = {
    message: string;
    tone?: "error" | "warning";
    onClose: () => void;
};

/**
 * Why the last send didn't go, or why dictation stopped, under the composer.
 * A card rather than a line of grey text, so a failed send reads as a
 * failure, and it can be put away once read.
 */
export default function ComposerNotice({
    message,
    tone = "error",
    onClose,
}: Props) {
    return (
        <Card
            role="alert"
            className={twMerge(
                "w-full gap-2! rounded-default border-solid py-2! px-3!",
                tone == "error"
                    ? "border-error/40! bg-error/5!"
                    : "border-warning/40! bg-warning/5!",
            )}
        >
            <TriangleAlert
                size={15}
                aria-hidden
                className={twMerge(
                    "shrink-0",
                    tone == "error" ? "text-error" : "text-warning",
                )}
            />
            <Span className="min-w-0 flex-1 text-xs leading-5 break-words">
                {message}
            </Span>
            <Button
                title="Dismiss"
                aria-label="Dismiss"
                type="button"
                variant="ghost"
                color="text"
                size="smaller"
                onClick={onClose}
                className="shrink-0 rounded-default-xs p-1! text-ink-secondary hover:text-ink"
            >
                <X size={14} aria-hidden />
            </Button>
        </Card>
    );
}
