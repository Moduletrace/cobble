import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import grabKnowledgebaseDocumentText from "./grab-knowledgebase-document-text";
import locatePassage from "./locate-passage";

type Params = {
    /**
     * The knowledgebases the run reaches: a document outside them is
     * refused.
     */
    knowledgebase_ids: number[];
    document_id: number;
    /**
     * Where to start: a passage a search returned, or a character offset
     * the last read said to go on from. Neither starts at the top.
     */
    from_passage?: number;
    from_char?: number;
    max_chars: number;
};

/**
 * A stretch of a knowledgebase document's own text (not its passages,
 * which overlap), up to `max_chars`, with the offset to go on from when
 * there's more.
 */
export default async function readKnowledgebaseDocument({
    knowledgebase_ids,
    document_id,
    from_passage,
    from_char,
    max_chars,
}: Params) {
    const document = (
        await BunSQLite.sql<{
            id: number;
            knowledgebase_id: number;
            name: string;
            source: string;
            content: string | null;
            media_id: number | null;
            mime_type: string | null;
        }>({
            sql: `SELECT id, knowledgebase_id, name, source, content, media_id, mime_type
                FROM knowledgebase_documents WHERE id = ? LIMIT 1`,
            values: [document_id],
        })
    ).payload?.[0];

    if (!document || !knowledgebase_ids.includes(Number(document.knowledgebase_id))) {
        throw new AppError(`That document isn't in a knowledgebase you have.`);
    }

    const text = (await grabKnowledgebaseDocumentText({ document })).replace(/\r\n/g, "\n");

    const passage =
        from_passage != null && from_char == null
            ? (
                  await BunSQLite.sql<{ text: string }>({
                      sql: `SELECT text FROM knowledgebase_chunks WHERE document_id = ? AND chunk_index = ? LIMIT 1`,
                      values: [document.id, from_passage],
                  })
              ).payload?.[0]?.text
            : undefined;

    const start = Math.min(
        text.length,
        Math.max(0, from_char ?? (passage ? locatePassage({ text, passage }) : 0)),
    );
    const end = Math.min(text.length, start + max_chars);

    return {
        name: document.name,
        start,
        length: text.length,
        text: text.slice(start, end),
        next: end < text.length ? end : null,
    };
}
