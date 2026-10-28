/**
 * The `media` columns a normal read takes, with a table alias.
 *
 * `text_content` is deliberately left out: it holds up to
 * `AppData.BotAttachmentTextStoreMaxChars` of extracted document text, and
 * every caller that only needs a file's name, type or path (`SELECT m.*`
 * did) pulled it into memory, into page props and into API responses.
 * Only knowledgebase documents keep it now; read it explicitly where it
 * is really used.
 */
export default function mediaColumns({
    alias = "m",
    with_text_content,
}: { alias?: string; with_text_content?: boolean } = {}) {
    const columns = [
        "id",
        "created_at",
        "updated_at",
        "user_id",
        "title",
        "description",
        "summary",
        "media_type",
        "media_write_path",
        "media_thumbnail_write_path",
        "mime_type",
        "is_primary",
        "is_rag_ingested",
        "archived",
    ];

    /**
     * Only a caller that really uses it asks for it.
     */
    if (with_text_content) columns.push("text_content");

    return columns.map((column) => `${alias}.${column}`).join(", ");
}
