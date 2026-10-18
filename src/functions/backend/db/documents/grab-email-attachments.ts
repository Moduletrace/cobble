import type { BUN_SQLITE_BSQLITE_EMAIL_ATTACHMENTS } from "@/db/types/db";
import type { APIResponseObject } from "@moduletrace/bun-sqlite";
import BunSQLite from "@moduletrace/bun-sqlite";

export type EmailAttachmentRecord = BUN_SQLITE_BSQLITE_EMAIL_ATTACHMENTS & {
    letter_title?: string;
    invoice_number?: string;
    invoice_title?: string;
    quote_number?: string;
    quote_title?: string;
    media_write_path?: string;
    media_mime_type?: string;
};

export default async function grabEmailAttachments({
    email_id,
}: {
    email_id: number | string;
}): Promise<APIResponseObject<EmailAttachmentRecord>> {
    return await BunSQLite.sql<EmailAttachmentRecord>({
        sql: `
            SELECT
                ea.*,
                l.title AS letter_title,
                i.invoice_number,
                i.title AS invoice_title,
                q.quote_number,
                q.title AS quote_title,
                m.media_write_path,
                m.mime_type AS media_mime_type
            FROM email_attachments ea
            LEFT JOIN letters l ON l.id = ea.letter_id
            LEFT JOIN invoices i ON i.id = ea.invoice_id
            LEFT JOIN quotes q ON q.id = ea.quote_id
            LEFT JOIN media m ON m.id = ea.media_id
            WHERE ea.email_id = ?
            ORDER BY ea.id ASC
        `,
        values: [email_id],
    });
}