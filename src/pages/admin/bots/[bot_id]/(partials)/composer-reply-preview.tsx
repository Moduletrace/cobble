import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import { Reply, X } from "lucide-react";
import type { BotMessageWithAttachments } from "@/src/types";
import messagePreview from "@/src/utils/message-preview";

type Props = {
    message: BotMessageWithAttachments;
    bot_name: string;
    onCancel: () => void;
};

/**
 * The message the next one will quote, above the composer, until it is
 * sent or dropped.
 */
export default function ComposerReplyPreview({ message, bot_name, onCancel }: Props) {
    const preview = messagePreview({ text: message.text || "" }) || "A file";

    return (
        <Row className="w-full max-w-container mx-auto gap-2! flex-nowrap items-center px-3 md:px-6 pt-4 pb-0">
            <Row className="min-w-0 grow gap-2! flex-nowrap items-center overflow-hidden rounded-default-lg border border-solid border-hairline bg-surface px-3 py-1.5">
                <Reply size={14} aria-hidden className="shrink-0 text-ink-secondary" />
                <Stack className="min-w-0 grow gap-0.5!">
                    <Span className="block w-full truncate text-[11px] font-bold leading-4 text-ink">
                        Replying to {message.author == "user" ? "yourself" : bot_name}
                    </Span>
                    <Span className="block w-full truncate text-xs leading-4 text-ink-secondary">
                        {preview}
                    </Span>
                </Stack>
            </Row>
            <Button
                title="Cancel reply"
                aria-label="Cancel reply"
                type="button"
                variant="ghost"
                color="gray"
                size="small"
                className="shrink-0 p-1!"
                onClick={onCancel}
            >
                <X size={14} aria-hidden />
            </Button>
        </Row>
    );
}
