import { LogCategories } from "@/src/dict/log-categories";
import { MediaParadigms, MediaTypes } from "@/src/dict/media-dict";
import {
    EmailAttachmentTypes,
    EmailStatuses,
    InvoiceStatuses,
    QuoteStatuses,
} from "@/src/dict/document-dict";
import type { BUN_SQLITE_DatabaseSchemaType } from "@moduletrace/bun-sqlite/types";

const schema: BUN_SQLITE_DatabaseSchemaType = {
    tables: [
        {
            tableName: "users",
            fields: [
                {
                    fieldName: "first_name",
                    dataType: "TEXT",
                },
                {
                    fieldName: "last_name",
                    dataType: "TEXT",
                },
                {
                    fieldName: "email",
                    dataType: "TEXT",
                    unique: true,
                },
                {
                    fieldName: "username",
                    dataType: "TEXT",
                    unique: true,
                },
                {
                    fieldName: "bio",
                    dataType: "TEXT",
                    html: true,
                },
                {
                    fieldName: "archived",
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 0,
                },
            ],
        },
        {
            tableName: "user_types",
            fields: [
                {
                    fieldName: "user_id",
                    dataType: "INTEGER",
                },
                {
                    fieldName: "user_type",
                    dataType: "TEXT",
                },
            ],
            indexes: [
                {
                    indexName: "idx_user_types_user_id_user_type",
                    indexTableFields: ["user_id", "user_type"],
                },
            ],
        },
        {
            tableName: "sso_login_codes",
            fields: [
                {
                    fieldName: "user_id",
                    dataType: "INTEGER",
                    unique: true,
                },
                {
                    fieldName: "code",
                    dataType: "TEXT",
                },
            ],
        },
        {
            tableName: "user_passwords",
            fields: [
                {
                    fieldName: "user_id",
                    dataType: "INTEGER",
                    unique: true,
                },
                {
                    fieldName: "password_hash",
                    dataType: "TEXT",
                },
            ],
        },
        {
            tableName: "media",
            fields: [
                {
                    fieldName: "user_id",
                    dataType: "INTEGER",
                },
                {
                    fieldName: "title",
                    dataType: "TEXT",
                },
                {
                    fieldName: "description",
                    dataType: "TEXT",
                },
                {
                    fieldName: "summary",
                    dataType: "TEXT",
                },
                {
                    fieldName: "media_type",
                    dataType: "TEXT",
                    options: MediaTypes.map((it) => it.value),
                },
                {
                    fieldName: "media_write_path",
                    dataType: "TEXT",
                },
                {
                    fieldName: "media_thumbnail_write_path",
                    dataType: "TEXT",
                },
                {
                    fieldName: "mime_type",
                    dataType: "TEXT",
                },
                {
                    fieldName: "text_content",
                    dataType: "TEXT",
                },
                {
                    fieldName: "is_primary",
                    dataType: "INTEGER",
                    options: [0, 1],
                },
                {
                    fieldName: "is_rag_ingested",
                    dataType: "INTEGER",
                    options: [0, 1],
                },
                {
                    fieldName: "is_private",
                    dataType: "INTEGER",
                    options: [0, 1],
                },
                {
                    fieldName: "archived",
                    dataType: "INTEGER",
                    options: [0, 1],
                },
            ],
            uniqueConstraints: [
                {
                    alias: "one_user_per_primary_profile_image",
                    constraintName: "One User per primary profile image",
                    constraintTableFields: [
                        { value: "user_id" },
                        { value: "is_primary" },
                    ],
                },
            ],
        },
        {
            tableName: "media_paradigms",
            fields: [
                {
                    fieldName: "media_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "media",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "media_paradigm_media_fk",
                    },
                },
                {
                    fieldName: "media_paradigm",
                    dataType: "TEXT",
                    options: MediaParadigms.map((mp) => mp.value),
                },
            ],
            indexes: [
                {
                    indexName: "idx_media_paradigms_media_id",
                    indexTableFields: ["media_id"],
                },
            ],
        },
        {
            tableName: "letters",
            fields: [
                {
                    fieldName: "title",
                    dataType: "TEXT",
                },
                {
                    fieldName: "to_name",
                    dataType: "TEXT",
                },
                {
                    fieldName: "to_address",
                    dataType: "TEXT",
                },
                {
                    fieldName: "from_name",
                    dataType: "TEXT",
                },
                {
                    fieldName: "from_address",
                    dataType: "TEXT",
                },
                {
                    fieldName: "subject",
                    dataType: "TEXT",
                },
                {
                    fieldName: "salutation",
                    dataType: "TEXT",
                },
                {
                    fieldName: "body_html",
                    dataType: "TEXT",
                    html: true,
                },
                {
                    fieldName: "closing",
                    dataType: "TEXT",
                },
                {
                    fieldName: "signature_name",
                    dataType: "TEXT",
                },
                {
                    fieldName: "signature_title",
                    dataType: "TEXT",
                },
                {
                    fieldName: "archived",
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 0,
                },
            ],
        },
        {
            tableName: "emails",
            fields: [
                {
                    fieldName: "title",
                    dataType: "TEXT",
                },
                {
                    fieldName: "subject",
                    dataType: "TEXT",
                },
                {
                    fieldName: "body_html",
                    dataType: "TEXT",
                    html: true,
                },
                {
                    fieldName: "to_emails",
                    dataType: "TEXT",
                },
                {
                    fieldName: "status",
                    dataType: "TEXT",
                    options: EmailStatuses.map((es) => es.value),
                    defaultValue: "draft",
                },
                {
                    fieldName: "sent_at",
                    dataType: "INTEGER",
                },
                {
                    fieldName: "archived",
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 0,
                },
            ],
        },
        {
            tableName: "email_attachments",
            fields: [
                {
                    fieldName: "email_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "emails",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "email_attachment_email_fk",
                    },
                },
                {
                    fieldName: "type",
                    dataType: "TEXT",
                    options: EmailAttachmentTypes.map((eat) => eat.value),
                },
                {
                    fieldName: "letter_id",
                    dataType: "INTEGER",
                    onDeleteLiteral: "SET NULL",
                    foreignKey: {
                        cascadeDelete: false,
                        destinationTableName: "letters",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "email_attachment_letter_fk",
                    },
                },
                {
                    fieldName: "media_id",
                    dataType: "INTEGER",
                    onDeleteLiteral: "SET NULL",
                    foreignKey: {
                        cascadeDelete: false,
                        destinationTableName: "media",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "email_attachment_media_fk",
                    },
                },
                {
                    fieldName: "invoice_id",
                    dataType: "INTEGER",
                    onDeleteLiteral: "SET NULL",
                    foreignKey: {
                        cascadeDelete: false,
                        destinationTableName: "invoices",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "email_attachment_invoice_fk",
                    },
                },
                {
                    fieldName: "quote_id",
                    dataType: "INTEGER",
                    onDeleteLiteral: "SET NULL",
                    foreignKey: {
                        cascadeDelete: false,
                        destinationTableName: "quotes",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "email_attachment_quote_fk",
                    },
                },
                {
                    fieldName: "file_name",
                    dataType: "TEXT",
                },
                {
                    fieldName: "mime_type",
                    dataType: "TEXT",
                },
            ],
            indexes: [
                {
                    indexName: "idx_email_attachments_email_id",
                    indexTableFields: ["email_id"],
                },
                {
                    indexName: "idx_email_attachments_media_id",
                    indexTableFields: ["media_id"],
                },
                {
                    indexName: "idx_email_attachments_invoice_id",
                    indexTableFields: ["invoice_id"],
                },
                {
                    indexName: "idx_email_attachments_quote_id",
                    indexTableFields: ["quote_id"],
                },
            ],
        },
        {
            tableName: "invoices",
            fields: [
                {
                    fieldName: "title",
                    dataType: "TEXT",
                },
                {
                    fieldName: "short_description",
                    dataType: "TEXT",
                },
                {
                    fieldName: "invoice_number",
                    dataType: "TEXT",
                    unique: true,
                },
                {
                    fieldName: "client_name",
                    dataType: "TEXT",
                },
                {
                    fieldName: "client_email",
                    dataType: "TEXT",
                },
                {
                    fieldName: "client_address",
                    dataType: "TEXT",
                },
                {
                    fieldName: "issue_date",
                    dataType: "INTEGER",
                },
                {
                    fieldName: "due_date",
                    dataType: "INTEGER",
                },
                {
                    fieldName: "status",
                    dataType: "TEXT",
                    options: InvoiceStatuses.map((is) => is.value),
                    defaultValue: "draft",
                },
                {
                    fieldName: "notes",
                    dataType: "TEXT",
                    html: true,
                },
                {
                    fieldName: "archived",
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 0,
                },
            ],
        },
        {
            tableName: "invoice_items",
            fields: [
                {
                    fieldName: "invoice_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "invoices",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "invoice_item_invoice_fk",
                    },
                },
                {
                    fieldName: "description",
                    dataType: "TEXT",
                },
                {
                    fieldName: "quantity",
                    dataType: "INTEGER",
                    defaultValue: 1,
                },
                {
                    fieldName: "unit_price_kobo",
                    dataType: "INTEGER",
                    defaultValue: 0,
                },
                {
                    fieldName: "sort_order",
                    dataType: "INTEGER",
                    defaultValue: 0,
                },
            ],
            indexes: [
                {
                    indexName: "idx_invoice_items_invoice_id",
                    indexTableFields: ["invoice_id"],
                },
            ],
        },
        {
            tableName: "quotes",
            fields: [
                {
                    fieldName: "title",
                    dataType: "TEXT",
                },
                {
                    fieldName: "short_description",
                    dataType: "TEXT",
                },
                {
                    fieldName: "quote_number",
                    dataType: "TEXT",
                    unique: true,
                },
                {
                    fieldName: "client_name",
                    dataType: "TEXT",
                },
                {
                    fieldName: "client_email",
                    dataType: "TEXT",
                },
                {
                    fieldName: "client_address",
                    dataType: "TEXT",
                },
                {
                    fieldName: "issue_date",
                    dataType: "INTEGER",
                },
                {
                    fieldName: "valid_until",
                    dataType: "INTEGER",
                },
                {
                    fieldName: "status",
                    dataType: "TEXT",
                    options: QuoteStatuses.map((qs) => qs.value),
                    defaultValue: "draft",
                },
                {
                    fieldName: "notes",
                    dataType: "TEXT",
                    html: true,
                },
                {
                    fieldName: "archived",
                    dataType: "INTEGER",
                    options: [0, 1],
                    defaultValue: 0,
                },
            ],
        },
        {
            tableName: "quote_items",
            fields: [
                {
                    fieldName: "quote_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "quotes",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "quote_item_quote_fk",
                    },
                },
                {
                    fieldName: "description",
                    dataType: "TEXT",
                },
                {
                    fieldName: "quantity",
                    dataType: "INTEGER",
                    defaultValue: 1,
                },
                {
                    fieldName: "unit_price_kobo",
                    dataType: "INTEGER",
                    defaultValue: 0,
                },
                {
                    fieldName: "sort_order",
                    dataType: "INTEGER",
                    defaultValue: 0,
                },
            ],
            indexes: [
                {
                    indexName: "idx_quote_items_quote_id",
                    indexTableFields: ["quote_id"],
                },
            ],
        },
        {
            tableName: "invoice_quotes",
            fields: [
                {
                    fieldName: "invoice_id",
                    dataType: "INTEGER",
                    foreignKey: {
                        cascadeDelete: true,
                        destinationTableName: "invoices",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "invoice_quote_invoice_fk",
                    },
                },
                {
                    fieldName: "quote_id",
                    dataType: "INTEGER",
                    onDeleteLiteral: "SET NULL",
                    foreignKey: {
                        cascadeDelete: false,
                        destinationTableName: "quotes",
                        destinationTableColumnName: "id",
                        destinationTableColumnType: "INTEGER",
                        foreignKeyName: "invoice_quote_quote_fk",
                    },
                },
                {
                    fieldName: "amount_kobo",
                    dataType: "INTEGER",
                },
            ],
            indexes: [
                {
                    indexName: "idx_invoice_quotes_invoice_id",
                    indexTableFields: ["invoice_id"],
                },
                {
                    indexName: "idx_invoice_quotes_quote_id",
                    indexTableFields: ["quote_id"],
                },
            ],
        },
        {
            tableName: "logs",
            fields: [
                {
                    fieldName: "title",
                    fieldDescription: `Log title used for searching and identification`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "category",
                    fieldDescription: `Log category used for filtering`,
                    dataType: "TEXT",
                    options: LogCategories.map((lc) => lc.value),
                },
                {
                    fieldName: "user_id",
                    fieldDescription: `User who triggered the action, if any`,
                    dataType: "INTEGER",
                },
                {
                    fieldName: "plain_text",
                    fieldDescription: `Plain text version of the log, full-text searchable`,
                    dataType: "TEXT",
                },
                {
                    fieldName: "markdown",
                    fieldDescription: `Markdown version of the log for formatted viewing`,
                    dataType: "TEXT",
                    markdown: true,
                },
                {
                    fieldName: "html",
                    fieldDescription: `HTML version of the log for frontend rendering`,
                    dataType: "TEXT",
                    html: true,
                },
                {
                    fieldName: "metadata",
                    fieldDescription: `Extra structured log data (ids, values, errors)`,
                    dataType: "TEXT",
                    json: true,
                },
                {
                    fieldName: "ip_address",
                    fieldDescription: `Client IP address that triggered the action, if any`,
                    dataType: "TEXT",
                },
            ],
            indexes: [
                {
                    indexName: "idx_logs_title",
                    indexTableFields: ["title"],
                },
                {
                    indexName: "idx_logs_category_created_at",
                    indexTableFields: ["category", "created_at"],
                },
                {
                    indexName: "idx_logs_user_id",
                    indexTableFields: ["user_id"],
                },
            ],
        },
    ],
};

export default schema;
