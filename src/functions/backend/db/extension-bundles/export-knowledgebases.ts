import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_KNOWLEDGEBASES } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import type { ExtensionBundleDocument } from "@/src/types";
import grabKnowledgebaseDocumentText from "../knowledgebases/grab-knowledgebase-document-text";
import parseKnowledgebaseRow from "../knowledgebases/parse-knowledgebase-row";
import type { ExtensionBundleEntry } from "./extension-bundle-entry";

type Params = {
    /**
     * The rows picked, or none for every one.
     */
    ids: number[];
};

type DocumentRow = {
    id: number;
    name: string;
    source: string;
    media_id: number | null;
    content: string | null;
    mime_type: string;
};

/**
 * Knowledgebases as a bundle carries them: the name and how it's
 * described, and each document's text. Never a file's bytes and never the
 * passages they were cut into: an import reads them again with its own
 * embedding model, and a bot only ever reads text.
 */
export default async function exportKnowledgebases({ ids }: Params): Promise<ExtensionBundleEntry[]> {
    const rows = await BunSQLite.sql<BUN_SQLITE_COBBLE_KNOWLEDGEBASES>({
        sql: `SELECT * FROM knowledgebases ORDER BY name COLLATE NOCASE ASC, id ASC`,
    });

    const wanted = ids.length ? new Set(ids.map(Number)) : null;
    const entries: ExtensionBundleEntry[] = [];

    for (const row of rows.payload || []) {
        const knowledgebase = parseKnowledgebaseRow({ row });

        if (wanted && !wanted.has(knowledgebase.id)) continue;

        const documents = await BunSQLite.sql<DocumentRow>({
            sql: `SELECT id, name, source, media_id, content, mime_type FROM knowledgebase_documents
                WHERE knowledgebase_id = ? ORDER BY name COLLATE NOCASE ASC, id ASC`,
            values: [knowledgebase.id],
        });

        const carried: ExtensionBundleDocument[] = [];
        let empty = 0;
        let cut = 0;

        for (const document of documents.payload || []) {
            const text = await grabKnowledgebaseDocumentText({ document });

            if (!text.trim()) {
                empty++;
                continue;
            }

            if (text.length > AppData.KnowledgebaseTextMaxChars) cut++;

            carried.push({
                name: document.name || `Document ${document.id}`,
                mime_type: "text/markdown",
                text: text.slice(0, AppData.KnowledgebaseTextMaxChars),
            });
        }

        const notes: string[] = [];

        if (empty) {
            notes.push(
                `${empty} ${empty == 1 ? "document" : "documents"} held no text to carry, so ${
                    empty == 1 ? "it was" : "they were"
                } left out.`,
            );
        }

        if (cut) {
            notes.push(
                `${cut} ${cut == 1 ? "document was" : "documents were"} cut to ${AppData.KnowledgebaseTextMaxChars} characters.`,
            );
        }

        entries.push({
            id: knowledgebase.id,
            item: {
                kind: "knowledgebase",
                key: knowledgebase.name.toLowerCase(),
                config: {
                    name: knowledgebase.name,
                    description: knowledgebase.description,
                    enabled: knowledgebase.enabled,
                    all_bots: false,
                },
                redacted: [],
                env_keys: [],
                notes,
                documents: carried,
            },
        });
    }

    return entries;
}