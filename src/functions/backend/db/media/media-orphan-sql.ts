/**
 * Every table that keeps a `media` row in use: a chat message's link, a bot
 * file's bytes, a task's file, a knowledgebase document, a bot's or a
 * workspace's picture. A row none of them names is unreachable: the pages
 * find media through those, never by id alone.
 */
export const UnreferencedMediaSql = `NOT EXISTS (SELECT 1 FROM bot_message_media l WHERE l.media_id = m.id)
    AND NOT EXISTS (SELECT 1 FROM bot_files f WHERE f.media_id = m.id)
    AND NOT EXISTS (SELECT 1 FROM task_media t WHERE t.media_id = m.id)
    AND NOT EXISTS (SELECT 1 FROM knowledgebase_documents d WHERE d.media_id = m.id)
    AND NOT EXISTS (SELECT 1 FROM bots b WHERE b.image_media_id = m.id)
    AND NOT EXISTS (SELECT 1 FROM workspaces w WHERE w.image_media_id = m.id)`;

type OrphanParams = {
    /** Rows newer than this are left alone, so an upload in flight survives. */
    cutoff: number;
    limit: number;
};

/**
 * The orphaned uploads older than `cutoff`, in one batch.
 *
 * A chat upload (`bot-attachment`) is reached only by its message's link;
 * one with no paradigm at all was never recorded. A row with another
 * paradigm is left to whatever made it, even when nothing points at it yet.
 */
export function mediaOrphanIdsSql({ cutoff, limit }: OrphanParams) {
    return {
        sql: `SELECT m.id FROM media m WHERE m.created_at < ?
            AND (NOT EXISTS (SELECT 1 FROM media_paradigms p WHERE p.media_id = m.id)
                OR (EXISTS (SELECT 1 FROM media_paradigms p WHERE p.media_id = m.id AND p.media_paradigm = 'bot-attachment')
                    AND NOT EXISTS (SELECT 1 FROM bot_message_media l WHERE l.media_id = m.id)))
            AND ${UnreferencedMediaSql}
            LIMIT ${Math.max(1, Math.floor(limit))}`,
        values: [cutoff],
    };
}

type UnlinkedParams = {
    /** Media ids an upload put on a chat message, now that its message is gone. */
    media_ids: number[];
};

/**
 * Which of `media_ids` nothing points at any more. Placeholders rather than
 * an id list in the text, so a number can never change the query.
 */
export function unlinkedAttachmentIdsSql({ media_ids }: UnlinkedParams) {
    const ids = Array.from(
        new Set(media_ids.map(Number).filter((id) => Number.isInteger(id) && id > 0)),
    );

    if (!ids.length) return null;

    return {
        sql: `SELECT m.id FROM media m WHERE m.id IN (${ids.map(() => "?").join(", ")})
            AND ${UnreferencedMediaSql}`,
        values: ids,
    };
}