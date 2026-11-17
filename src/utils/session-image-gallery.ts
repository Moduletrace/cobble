import type { BotMessageWithAttachments, FilePreviewItem, PublicBotFile } from "@/src/types";
import imagePreviewGallery from "./image-preview-gallery";
import liveFileRefIds from "./live-file-ref-ids";

/**
 * Every image in a conversation, in the order the messages show them
 * (oldest first): each message's attached pictures, then the image files it
 * names (`[file:ID]`), bot and user alike. A picture shown twice - attached
 * and named, or named by two messages - appears once, at its first place.
 * This is the gallery the preview steps through, so opening any picture
 * walks the whole session rather than one reply. `files` holds the named
 * files already looked up (null for one still loading or unreachable).
 */
export default function sessionImageGallery({
    messages,
    files,
}: {
    messages: BotMessageWithAttachments[];
    files: Map<number, PublicBotFile | null>;
}): FilePreviewItem[] {
    const items: FilePreviewItem[] = [];
    const seen = new Set<string>();

    const push = (item: FilePreviewItem) => {
        if (!item.url || seen.has(item.url)) return;

        seen.add(item.url);
        items.push(item);
    };

    for (const message of messages) {
        const attachments = message.attachments || [];

        for (const attachment of attachments) {
            if (attachment.media_type == "image") push(attachment);
        }

        for (const id of liveFileRefIds({ text: message.text || "" })) {
            if (attachments.some((it) => it.file_id == id)) continue;

            const file = files.get(id);

            if (file) push(file);
        }
    }

    return imagePreviewGallery({ items });
}
