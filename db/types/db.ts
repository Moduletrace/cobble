export const BunSQLiteTables = [
    "users",
    "user_types",
    "sso_login_codes",
    "user_passwords",
    "media",
    "media_paradigms",
    "letters",
    "emails",
    "email_attachments",
    "invoices",
    "invoice_items",
    "quotes",
    "quote_items",
    "invoice_quotes",
    "logs",
] as const

export type BUN_SQLITE_BSQLITE_USERS = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    first_name?: string;
    last_name?: string;
    email?: string;
    username?: string;
    bio?: string;
    archived?: 0 | 1 | "";
}

export type BUN_SQLITE_BSQLITE_USER_TYPES = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    user_id?: number | "";
    user_type?: string;
}

export type BUN_SQLITE_BSQLITE_SSO_LOGIN_CODES = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    user_id?: number | "";
    code?: string;
}

export type BUN_SQLITE_BSQLITE_USER_PASSWORDS = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    user_id?: number | "";
    password_hash?: string;
}

export type BUN_SQLITE_BSQLITE_MEDIA = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    user_id?: number | "";
    title?: string;
    description?: string;
    summary?: string;
    media_type?: "image" | "video" | "document" | "";
    media_write_path?: string;
    media_thumbnail_write_path?: string;
    mime_type?: string;
    text_content?: string;
    is_primary?: 0 | 1 | "";
    is_rag_ingested?: 0 | 1 | "";
    is_private?: 0 | 1 | "";
    archived?: 0 | 1 | "";
}

export type BUN_SQLITE_BSQLITE_MEDIA_PARADIGMS = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    media_id?: number | "";
    media_paradigm?: "user-profile-image" | "generic" | "event" | "";
}

export type BUN_SQLITE_BSQLITE_LETTERS = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    title?: string;
    to_name?: string;
    to_address?: string;
    from_name?: string;
    from_address?: string;
    subject?: string;
    salutation?: string;
    body_html?: string;
    closing?: string;
    signature_name?: string;
    signature_title?: string;
    archived?: 0 | 1 | "";
}

export type BUN_SQLITE_BSQLITE_EMAILS = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    title?: string;
    subject?: string;
    body_html?: string;
    to_emails?: string;
    status?: "draft" | "sent" | "";
    sent_at?: number | "";
    archived?: 0 | 1 | "";
}

export type BUN_SQLITE_BSQLITE_EMAIL_ATTACHMENTS = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    email_id?: number | "";
    type?: "letter" | "invoice" | "quote" | "file" | "";
    letter_id?: number | "";
    media_id?: number | "";
    invoice_id?: number | "";
    quote_id?: number | "";
    file_name?: string;
    mime_type?: string;
}

export type BUN_SQLITE_BSQLITE_INVOICES = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    title?: string;
    short_description?: string;
    invoice_number?: string;
    client_name?: string;
    client_email?: string;
    client_address?: string;
    issue_date?: number | "";
    due_date?: number | "";
    status?: "draft" | "issued" | "paid" | "cancelled" | "";
    notes?: string;
    archived?: 0 | 1 | "";
}

export type BUN_SQLITE_BSQLITE_INVOICE_ITEMS = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    invoice_id?: number | "";
    description?: string;
    quantity?: number | "";
    unit_price_kobo?: number | "";
    sort_order?: number | "";
}

export type BUN_SQLITE_BSQLITE_QUOTES = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    title?: string;
    short_description?: string;
    quote_number?: string;
    client_name?: string;
    client_email?: string;
    client_address?: string;
    issue_date?: number | "";
    valid_until?: number | "";
    status?: "draft" | "sent" | "accepted" | "declined" | "expired" | "";
    notes?: string;
    archived?: 0 | 1 | "";
}

export type BUN_SQLITE_BSQLITE_QUOTE_ITEMS = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    quote_id?: number | "";
    description?: string;
    quantity?: number | "";
    unit_price_kobo?: number | "";
    sort_order?: number | "";
}

export type BUN_SQLITE_BSQLITE_INVOICE_QUOTES = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    invoice_id?: number | "";
    quote_id?: number | "";
    amount_kobo?: number | "";
}

export type BUN_SQLITE_BSQLITE_LOGS = {
    /** 
     * The unique identifier of the record.
     */
    id?: number | "";
    /** 
     * The time when the record was created. (Unix Timestamp)
     */
    created_at?: number | "";
    /** 
     * The time when the record was updated. (Unix Timestamp)
     */
    updated_at?: number | "";
    /** 
     * Log title used for searching and identification
     */
    title?: string;
    /** 
     * Log category used for filtering
     */
    category?: "auth" | "websocket" | "cron" | "system" | "error" | "";
    /** 
     * User who triggered the action, if any
     */
    user_id?: number | "";
    /** 
     * Plain text version of the log, full-text searchable
     */
    plain_text?: string;
    /** 
     * Markdown version of the log for formatted viewing
     */
    markdown?: string;
    /** 
     * HTML version of the log for frontend rendering
     */
    html?: string;
    /** 
     * Extra structured log data (ids, values, errors)
     */
    metadata?: string;
    /** 
     * Client IP address that triggered the action, if any
     */
    ip_address?: string;
}

export type BUN_SQLITE_BSQLITE_ALL_TYPEDEFS = BUN_SQLITE_BSQLITE_USERS & BUN_SQLITE_BSQLITE_USER_TYPES & BUN_SQLITE_BSQLITE_SSO_LOGIN_CODES & BUN_SQLITE_BSQLITE_USER_PASSWORDS & BUN_SQLITE_BSQLITE_MEDIA & BUN_SQLITE_BSQLITE_MEDIA_PARADIGMS & BUN_SQLITE_BSQLITE_LETTERS & BUN_SQLITE_BSQLITE_EMAILS & BUN_SQLITE_BSQLITE_EMAIL_ATTACHMENTS & BUN_SQLITE_BSQLITE_INVOICES & BUN_SQLITE_BSQLITE_INVOICE_ITEMS & BUN_SQLITE_BSQLITE_QUOTES & BUN_SQLITE_BSQLITE_QUOTE_ITEMS & BUN_SQLITE_BSQLITE_INVOICE_QUOTES & BUN_SQLITE_BSQLITE_LOGS