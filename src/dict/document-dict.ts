export const EmailStatuses = [
    {
        title: "Draft",
        value: "draft",
    },
    {
        title: "Sent",
        value: "sent",
    },
] as const;

export type EmailStatus = (typeof EmailStatuses)[number]["value"];

export const EmailAttachmentTypes = [
    {
        title: "Letter",
        value: "letter",
    },
    {
        title: "Invoice",
        value: "invoice",
    },
    {
        title: "Quote",
        value: "quote",
    },
    {
        title: "File",
        value: "file",
    },
] as const;

export type EmailAttachmentType = (typeof EmailAttachmentTypes)[number]["value"];

export const InvoiceStatuses = [
    {
        title: "Draft",
        value: "draft",
    },
    {
        title: "Issued",
        value: "issued",
    },
    {
        title: "Paid",
        value: "paid",
    },
    {
        title: "Cancelled",
        value: "cancelled",
    },
] as const;

export type InvoiceStatus = (typeof InvoiceStatuses)[number]["value"];

export const QuoteStatuses = [
    {
        title: "Draft",
        value: "draft",
    },
    {
        title: "Sent",
        value: "sent",
    },
    {
        title: "Accepted",
        value: "accepted",
    },
    {
        title: "Declined",
        value: "declined",
    },
    {
        title: "Expired",
        value: "expired",
    },
] as const;

export type QuoteStatus = (typeof QuoteStatuses)[number]["value"];