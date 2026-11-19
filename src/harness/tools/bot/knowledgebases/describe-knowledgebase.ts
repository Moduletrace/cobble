import type { KnowledgebaseDocument, PublicKnowledgebase } from "@/src/types";
import formatBytes from "@/src/utils/format-bytes";
import relativeTime from "@/src/utils/relative-time";
import describeExtensionAccess from "../extensions/describe-extension-access";

type Params = {
    knowledgebase: PublicKnowledgebase;
    /**
     * The knowledgebase's documents, when they were read: how many passages
     * are searchable, and what went wrong reading them.
     */
    documents?: KnowledgebaseDocument[];
};

/**
 * One knowledgebase as a bot reads it: what it holds, how much of it is
 * searchable yet, who reaches it and when it changed. The state line is
 * the app's own record, so a bot never reports "indexed" from memory.
 */
export default function describeKnowledgebase({ knowledgebase, documents }: Params) {
    const lines = [
        `#${knowledgebase.id} ${knowledgebase.name}${knowledgebase.enabled ? "" : " (off: no bot can search it)"}`,
    ];

    if (knowledgebase.description) lines.push(knowledgebase.description);

    lines.push(
        `Documents: ${knowledgebase.document_count}` +
            (knowledgebase.pending_count ? `, ${knowledgebase.pending_count} not read yet` : "") +
            (knowledgebase.error_count
                ? `, ${knowledgebase.error_count} failed (retry_failed_documents reads those again)`
                : "") +
            (knowledgebase.warning_count ? `, ${knowledgebase.warning_count} with a warning` : "") +
            (knowledgebase.stale_count
                ? `, ${knowledgebase.stale_count} searchable by words only or read by another embedding model (re-indexing fixes it)`
                : "") +
            `, ${formatBytes({ bytes: knowledgebase.size })} of files`,
        `Access: ${describeExtensionAccess({ ...knowledgebase.access })}`,
        knowledgebase.updated_at ? `Updated ${relativeTime({ at: knowledgebase.updated_at })}` : "",
    );

    if (documents) {
        if (!documents.length) {
            lines.push("No documents yet.");
        } else {
            lines.push(
                "Documents:",
                ...documents.map(
                    (document) =>
                        `  #${document.id} ${document.name} (${formatBytes({ bytes: document.size })}, ${
                            document.ingest_error
                                ? `failed: ${document.ingest_error}`
                                : document.chunk_count
                                  ? `${document.chunk_count} passages${
                                        document.ingested_at ? `, read ${relativeTime({ at: document.ingested_at })}` : ""
                                    }`
                                  : "not read yet"
                        })`,
                ),
            );
        }
    }

    return lines.filter(Boolean).join("\n");
}