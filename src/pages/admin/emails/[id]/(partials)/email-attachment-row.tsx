import type { EmailAttachmentRecord } from "@/src/functions/backend/db/documents/grab-email-attachments";
import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import Row from "@moduletrace/twui/layout/Row";
import LucideIcon from "@moduletrace/twui/elements/lucide-icon";

type Props = {
    attachment: EmailAttachmentRecord;
};

export default function EmailAttachmentRow({ attachment }: Props) {
    if (attachment.type == "letter" && attachment.letter_id) {
        return (
            <Link
                href={`/admin/letters/${attachment.letter_id}`}
                className="text-sm"
                target="_blank"
                title={attachment.letter_title}
            >
                <Row className="gap-2!">
                    <LucideIcon name="FileBox" size={15} />
                    <Span className="text-sm">
                        {attachment.letter_title ||
                            `Letter #${attachment.letter_id}`}
                    </Span>
                </Row>
            </Link>
        );
    }

    if (attachment.type == "invoice" && attachment.invoice_id) {
        return (
            <Link
                href={`/admin/invoices/${attachment.invoice_id}`}
                target="_blank"
                className="text-sm"
                title={attachment.invoice_title}
            >
                <Row className="gap-2!">
                    <LucideIcon name="Banknote" size={15} />
                    <Span className="text-sm">
                        {attachment.invoice_title ||
                            attachment.invoice_number ||
                            `Invoice #${attachment.invoice_id}`}
                    </Span>
                </Row>
            </Link>
        );
    }

    if (attachment.type == "quote" && attachment.quote_id) {
        return (
            <Link
                href={`/admin/quotes/${attachment.quote_id}`}
                target="_blank"
                className="text-sm"
                title={attachment.quote_title}
            >
                <Row className="gap-2!">
                    <LucideIcon name="Calculator" size={15} />
                    <Span className="text-sm">
                        {attachment.quote_title ||
                            attachment.quote_number ||
                            `Quote #${attachment.quote_id}`}
                    </Span>
                </Row>
            </Link>
        );
    }

    return (
        <Span className="text-sm">
            {attachment.file_name || `File #${attachment.media_id}`}
        </Span>
    );
}
