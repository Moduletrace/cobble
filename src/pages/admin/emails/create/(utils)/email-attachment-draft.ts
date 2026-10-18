export type EmailAttachmentDraft = {
    type: "letter" | "invoice" | "quote" | "file";
    letter_id?: number;
    invoice_id?: number;
    quote_id?: number;
    media_id?: number;
    file_name?: string;
    mime_type?: string;
};