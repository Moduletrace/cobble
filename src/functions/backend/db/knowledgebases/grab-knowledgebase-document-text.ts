import BunSQLite from "@moduletrace/bun-sqlite";
import extractBotFileText from "../bot-files/extract-bot-file-text";

type Params = {
    document: {
        source?: string | null;
        content?: string | null;
        media_id?: number | null;
        name?: string | null;
        mime_type?: string | null;
    };
};

/**
 * A knowledgebase document's whole text: what was written in, or what its
 * file holds (the text pulled out at upload, else unpacked now).
 */
export default async function grabKnowledgebaseDocumentText({ document }: Params) {
    if (document.source == "text") return document.content || "";

    if (!document.media_id) return "";

    const media = await BunSQLite.sql<{ media_write_path?: string; text_content?: string }>({
        sql: `SELECT media_write_path, text_content FROM media WHERE id = ? LIMIT 1`,
        values: [document.media_id],
    }).then((res) => res.payload?.[0]);

    return (
        (await extractBotFileText({
            write_path: media?.media_write_path,
            text_content: media?.text_content,
            name: document.name,
            mime_type: document.mime_type,
        })) || ""
    );
}
