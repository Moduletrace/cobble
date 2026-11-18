type Args = {
    file_id?: number;
    media_id?: number;
    path?: string;
    text?: string;
    document_id?: number;
};

/**
 * Where a knowledgebase document comes from: a bot's saved file, the
 * user's own upload, a file on a computer, or text written here.
 */
export type KnowledgebaseDocumentSource = "file" | "media" | "path" | "text";

/**
 * Which of the arguments names the source, or what's wrong with them. The
 * four are exclusive, so a call can't quietly take one and ignore another,
 * and a document id rewrites text only (a file is replaced by adding a new
 * one and deleting the old).
 */
export default function resolveKnowledgebaseDocumentSource({
    args,
}: {
    args: Args;
}): { source: KnowledgebaseDocumentSource } | { problem: string } {
    if (args.document_id && !args.text) {
        return {
            problem: `document_id rewrites a text document, so give its new "text" too. A file is replaced by adding the new one and deleting the old.`,
        };
    }

    const sources: KnowledgebaseDocumentSource[] = [
        ...(args.file_id ? (["file"] as const) : []),
        ...(args.media_id ? (["media"] as const) : []),
        ...(args.path ? (["path"] as const) : []),
        ...(args.text ? (["text"] as const) : []),
    ];

    if (sources.length != 1) {
        return {
            problem: `Give exactly one source: file_id (a saved file, from list_files), media_id (an upload the user sent), path (a file on a computer) or text (written here).`,
        };
    }

    return { source: sources[0]! };
}