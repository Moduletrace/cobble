import Row from "@moduletrace/twui/layout/Row";
import type { PendingAttachment } from "../(hooks)/use-composer-attachments";
import ComposerAttachmentChip from "./composer-attachment-chip";

type Props = {
    pending: PendingAttachment[];
    onRemove: (params: { key: string }) => void;
};

/**
 * The next message's files, just above the composer rule.
 */
export default function ComposerAttachments({ pending, onRemove }: Props) {
    if (!pending.length) return null;

    return (
        <Row className="w-full max-w-[760px] mx-auto gap-2! px-6 pb-3">
            {pending.map((item) => (
                <ComposerAttachmentChip
                    key={item.key}
                    name={item.name}
                    status={item.status}
                    attachment={item.attachment}
                    error={item.error}
                    onRemove={() => onRemove({ key: item.key })}
                />
            ))}
        </Row>
    );
}
