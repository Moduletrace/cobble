import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";

const db = new Database(":memory:");

db.run(
    `CREATE TABLE media (
        id INTEGER PRIMARY KEY,
        created_at INTEGER,
        updated_at INTEGER,
        user_id INTEGER,
        title TEXT,
        description TEXT,
        summary TEXT,
        media_type TEXT,
        media_write_path TEXT,
        media_thumbnail_write_path TEXT,
        mime_type TEXT,
        text_content TEXT,
        is_primary INTEGER,
        is_rag_ingested INTEGER,
        archived INTEGER
    )`,
);
db.run(`CREATE TABLE bot_message_media (id INTEGER PRIMARY KEY, message_id INTEGER, media_id INTEGER)`);
db.run(
    `INSERT INTO media (id, title, media_type, media_write_path, mime_type, text_content)
        VALUES (1, 'invoice.pdf', 'document', 'media/1.pdf', 'application/pdf', 'Total: 12')`,
);
db.run(`INSERT INTO bot_message_media (id, message_id, media_id) VALUES (1, 10, 1)`);

/**
 * The query `grabMessagesMedia` builds, with the text column included or
 * left out. It is the largest column in the table, so only the reply path
 * that hands a document to a model asks for it.
 */
function read({ with_text_content }: { with_text_content: boolean }) {
    const columns = [
        "m.id",
        "m.title",
        "m.media_type",
        "m.media_write_path",
        "m.mime_type",
        ...(with_text_content ? ["m.text_content"] : []),
    ].join(", ");

    return db
        .query(
            `SELECT ${columns}, l.message_id FROM bot_message_media l
            JOIN media m ON m.id = l.media_id
            WHERE l.message_id = 10`,
        )
        .get() as Record<string, unknown>;
}

describe("grabMessagesMedia", () => {
    test("a plain read never drags the extracted text along", () => {
        expect(read({ with_text_content: false })).not.toHaveProperty("text_content");
    });

    test("the reply path can ask for it", () => {
        expect(read({ with_text_content: true }).text_content).toBe("Total: 12");
    });

    test("the row's name and path are always there", () => {
        expect(read({ with_text_content: false })).toMatchObject({
            title: "invoice.pdf",
            media_write_path: "media/1.pdf",
            message_id: 10,
        });
    });
});
