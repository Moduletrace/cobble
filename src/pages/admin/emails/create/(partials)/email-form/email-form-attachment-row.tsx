import Tag from "@moduletrace/twui/elements/Tag";
import LucideIcon from "@moduletrace/twui/elements/lucide-icon";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import type { EmailAttachmentDraft } from "../../(utils)/email-attachment-draft";

type Props = {
    attachment: EmailAttachmentDraft;
    onRemove: () => void;
};

export default function EmailFormAttachmentRow({
    attachment,
    onRemove,
}: Props) {
    const is_letter = attachment.type == "letter";
    const is_invoice = attachment.type == "invoice";
    const is_quote = attachment.type == "quote";

    const label = attachment.file_name ||
        (is_letter
            ? `Letter #${attachment.letter_id}`
            : is_invoice
                ? `Invoice #${attachment.invoice_id}`
                : is_quote
                    ? `Quote #${attachment.quote_id}`
                    : `File #${attachment.media_id}`);

    const type_title = is_letter
        ? "Letter"
        : is_invoice
            ? "Invoice"
            : is_quote
                ? "Quote"
                : "File";

    return (
        <Row className="w-full items-center gap-2!">
            <LucideIcon
                name={
                    is_letter
                        ? "Paperclip"
                        : is_invoice
                            ? "Receipt"
                            : is_quote
                                ? "Calculator"
                                : "File"
                }
                size={16}
            />
            <Span className="text-sm min-w-0 flex-1 truncate">
                {label}
            </Span>
            <Tag
                color={
                    is_letter
                        ? "secondary"
                        : is_invoice
                            ? "primary"
                            : is_quote
                                ? "accent"
                                : "gray"
                }
            >
                {type_title}
            </Tag>
            <Button
                title="Remove Attachment"
                variant="ghost"
                color="gray"
                onClick={onRemove}
            >
                <LucideIcon name="Trash" size={16} />
            </Button>
        </Row>
    );
}