import Img from "@moduletrace/twui/layout/Img";
import Span from "@moduletrace/twui/layout/Span";
import type { BotMessageAttachment } from "@/src/types";
import FilePreviewLink from "@/src/components/general/file-preview-link";
import AttachmentIcon from "./attachment-icon";

/**
 * One file on a message: an image as a thumbnail, anything else as a
 * named chip. Both open the file in the preview.
 */
export default function MessageAttachment({
    name,
    media_type,
    url,
    thumbnail_url,
}: BotMessageAttachment) {
    if (media_type == "image") {
        return (
            <FilePreviewLink name={name} url={url} media_type={media_type} title={name} className="block">
                <Img
                    src={thumbnail_url || url}
                    alt={name}
                    className="max-h-48 max-w-64 rounded-default-lg border border-solid border-hairline object-cover"
                />
            </FilePreviewLink>
        );
    }

    return (
        <FilePreviewLink
            name={name}
            url={url}
            media_type={media_type}
            title={name}
            className="flex max-w-64 items-center gap-2 rounded-default-lg border border-solid border-hairline bg-surface px-3 py-2 text-[13px] leading-[18px] text-ink no-underline hover:border-hairline-strong"
        >
            <AttachmentIcon media_type={media_type} />
            <Span className="truncate">{name}</Span>
        </FilePreviewLink>
    );
}
