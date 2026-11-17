import { useContext } from "react";
import Row from "@moduletrace/twui/layout/Row";
import type { BotMessageAttachment } from "@/src/types";
import imagePreviewGallery from "@/src/utils/image-preview-gallery";
import { SessionGalleryContext } from "../(data)/session-gallery-context";
import MessageAttachment from "./message-attachment";

type Props = {
    attachments?: BotMessageAttachment[];
};

/**
 * A message's files, right-aligned above its bubble. Its images open the
 * conversation's gallery in a thread (every image in the session), or their
 * own gallery on their own, so opening one steps through the others.
 */
export default function MessageAttachments({ attachments }: Props) {
    const session_gallery = useContext(SessionGalleryContext);

    if (!attachments?.length) return null;

    const gallery = session_gallery ?? imagePreviewGallery({ items: attachments });

    return (
        <Row className="max-w-[80%] gap-2! justify-end">
            {attachments.map((attachment) => (
                <MessageAttachment key={attachment.id} {...attachment} gallery={gallery} />
            ))}
        </Row>
    );
}
