import { useContext, useMemo } from "react";
import Row from "@moduletrace/twui/layout/Row";
import type { BotMessageAttachment, BotMessageWithAttachments, MediaType, PublicBotFile } from "@/src/types";
import filePreviewKind from "@/src/utils/file-preview-kind";
import imagePreviewGallery from "@/src/utils/image-preview-gallery";
import liveFileRefIds from "@/src/utils/live-file-ref-ids";
import { SessionGalleryContext } from "../(data)/session-gallery-context";
import useReferencedFiles from "../(hooks)/use-referenced-files";
import MessageAttachment from "./message-attachment";

type Props = {
    message: BotMessageWithAttachments;
};

/**
 * A referenced file as an attachment, so the section shows both the same
 * way: its `bot_files` id doubles as the attachment id (nothing else on
 * the message carries that id).
 */
function fileToImage({ file }: { file: PublicBotFile }): BotMessageAttachment {
    return {
        id: file.id,
        name: file.name,
        media_type: file.media_type as MediaType,
        url: file.url,
        thumbnail_url: file.thumbnail_url,
        file_id: file.id,
        full_path: file.full_path,
        size: file.size,
    };
}

/**
 * The images a bot message is about, under its text: the pictures attached
 * to it and the image files it names (`[file:ID]`), each a thumbnail that
 * opens the file preview. In a thread they open the conversation's gallery
 * (every image in the session, bot and user); on their own, one gallery of
 * this message's images, so opening one steps through the others. A file
 * named twice (attached and referenced) shows once; refs inside longer code
 * never render as chips, so they show no picture either. Nothing renders
 * when the message names no image.
 */
export default function MessageImages({ message }: Props) {
    const session_gallery = useContext(SessionGalleryContext);
    const attachments = message.attachments || [];
    const ref_ids = useMemo(
        () =>
            liveFileRefIds({ text: message.text || "" }).filter(
                (id) => !attachments.some((it) => it.file_id == id),
            ),
        [message.text, message.attachments],
    );
    const referenced = useReferencedFiles({ file_ids: ref_ids });

    const referenced_images: PublicBotFile[] = [];

    for (const file of referenced) {
        if (
            file &&
            file.url &&
            filePreviewKind({ name: file.name, media_type: file.media_type }) == "image"
        ) {
            referenced_images.push(file);
        }
    }

    const images = [
        ...attachments
            .filter((it) => it.media_type == "image")
            .map((it) => ({ key: `attachment-${it.id}`, image: it })),
        ...referenced_images.map((file) => ({ key: `file-${file.id}`, image: fileToImage({ file }) })),
    ];

    if (!images.length) return null;

    const gallery = session_gallery ?? imagePreviewGallery({ items: images.map((it) => it.image) });

    return (
        <Row itemsStart className="max-w-full gap-2!">
            {images.map((it) => (
                <MessageAttachment key={it.key} {...it.image} gallery={gallery} />
            ))}
        </Row>
    );
}
