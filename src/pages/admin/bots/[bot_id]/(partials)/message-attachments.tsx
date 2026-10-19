import Row from "@moduletrace/twui/layout/Row";
import type { BotMessageAttachment } from "@/src/types";
import MessageAttachment from "./message-attachment";

type Props = {
    attachments?: BotMessageAttachment[];
};

/**
 * A message's files, right-aligned above its bubble.
 */
export default function MessageAttachments({ attachments }: Props) {
    if (!attachments?.length) return null;

    return (
        <Row className="max-w-[80%] gap-2! justify-end">
            {attachments.map((attachment) => (
                <MessageAttachment key={attachment.id} {...attachment} />
            ))}
        </Row>
    );
}
