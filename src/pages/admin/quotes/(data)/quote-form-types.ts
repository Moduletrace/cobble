import type { BUN_SQLITE_BSQLITE_QUOTES } from "@/db/types/db";
import type { QuoteStatus } from "@/src/dict/document-dict";

export type QuoteItemFormObject = {
    description?: string;
    quantity?: string;
    /** Naira amount as a plain number string (converted to kobo on submit). */
    unit_price?: string;
    /** Client-side row identity for stable React keys during reorder. */
    _key?: string;
};

export type QuoteFormObject = {
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
    valid_until?: number | "";
    status?: QuoteStatus | "";
    items?: QuoteItemFormObject[];
};