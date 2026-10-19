import Button from "@moduletrace/twui/layout/Button";
import Loading from "@moduletrace/twui/elements/Loading";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { X } from "lucide-react";
import type { PendingAttachment } from "../(hooks)/use-composer-attachments";
import AttachmentIcon from "./attachment-icon";
import ComposerAttachmentPreview from "./composer-attachment-preview";

type Props = Omit<PendingAttachment, "key"> & {
    onRemove: () => void;
};

/**
 * A file waiting to go with the next message: uploading, ready, or failed
 * (with why, on hover). Removable until sent. An image shows a
 * small preview in place of its icon.
 */
export default function ComposerAttachmentChip({
    name,
    status,
    attachment,
    error,
    preview_url,
    onRemove,
}: Props) {
    const image_src =
        preview_url ||
        (attachment?.media_type == "image"
            ? attachment.thumbnail_url || attachment.url
            : undefined);

    return (
        <Row
            title={status == "failed" ? `${name}: ${error}` : name}
            className={`max-w-56 gap-2! flex-nowrap items-center rounded-default-lg border border-solid bg-surface pl-3 pr-1 py-1 text-[13px] leading-[18px] ${status == "failed" ? "border-ink text-ink-secondary line-through" : "border-hairline text-ink"}`}
        >
            {status == "uploading" ? (
                <Loading size="smaller" />
            ) : image_src ? (
                <ComposerAttachmentPreview src={image_src} />
            ) : (
                <AttachmentIcon media_type={attachment?.media_type} />
            )}
            <Span className="truncate">{name}</Span>
            <Button
                title={`Remove ${name}`}
                type="button"
                variant="ghost"
                color="gray"
                size="small"
                className="shrink-0 p-1!"
                onClick={onRemove}
            >
                <X size={14} aria-hidden />
            </Button>
        </Row>
    );
}
