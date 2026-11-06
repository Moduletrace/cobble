import Row from "@moduletrace/twui/layout/Row";
import type { BotMessageAttachment } from "@/src/types";
import imagePreviewGallery from "@/src/utils/image-preview-gallery";
import MessageAttachment from "./message-attachment";

type Props = {
    attachments?: BotMessageAttachment[];
};

/**
 * A message's files, right-aligned above its bubble. Its images make one
 * gallery, so opening one steps through the others.
 */
export default function MessageAttachments({ attachments }: Props) {
    if (!attachments?.length) return null;

    const gallery = imagePreviewGallery({ items: attachments });

    return (
        <Row className="max-w-[80%] gap-2! justify-end">
            {attachments.map((attachment) => (
                <MessageAttachment key={attachment.id} {...attachment} gallery={gallery} />
            ))}
        </Row>
    );
}
