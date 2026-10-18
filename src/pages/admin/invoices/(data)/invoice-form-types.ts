import type { InvoiceStatus } from "@/src/dict/document-dict";

export type InvoiceItemFormObject = {
    description?: string;
    quantity?: string;
    /** Naira amount as a plain number string (converted to kobo on submit). */
    unit_price?: string;
    /** Client-side row identity for stable React keys during reorder. */
    _key?: string;
};

export type QuoteLinkFormObject = {
    quote_id?: number | "";
    /** Naira amount as a plain number string (converted to kobo on submit). */
    amount?: string;
};

export type InvoiceFormObject = {
    id?: number | "";
    title?: string;
    short_description?: string;
    client_name?: string;
    client_email?: string;
    client_address?: string;
    notes?: string;
    /**
     * Unix timestamps in ms. `""` when not set.
     */
    issue_date?: number | "";
    due_date?: number | "";
    status?: InvoiceStatus | "";
    items?: InvoiceItemFormObject[];
    quote_link?: QuoteLinkFormObject;
};
