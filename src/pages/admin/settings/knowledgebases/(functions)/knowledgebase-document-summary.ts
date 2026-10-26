import type { KnowledgebaseDocument } from "@/src/types";
import formatBytes from "@/src/utils/format-bytes";
import checkedAgo from "../../(utils)/checked-ago";

type Params = {
    document: KnowledgebaseDocument;
    /**
     * The install's embedding model now, to tell a document embedded by
     * another one.
     */
    embedding_model: string | null;
};

/**
 * One document's line: what it is, its size, how much of it is searchable
 * and when it was added. "Text · 3.1 KB · 4 passages · Added 5m ago".
 */
export default function knowledgebaseDocumentSummary({ document, embedding_model }: Params) {
    const kind = document.source == "text" ? "Text" : (document.name.split(".").pop() || "File").toUpperCase();

    const state = document.indexing
        ? "Being read"
        : document.ingest_error
          ? document.ingest_error
          : !document.embedding_model
            ? `${document.chunk_count} ${document.chunk_count == 1 ? "passage" : "passages"}, by words only`
            : document.embedding_model != embedding_model
              ? `${document.chunk_count} ${document.chunk_count == 1 ? "passage" : "passages"}, needs re-indexing`
              : `${document.chunk_count} ${document.chunk_count == 1 ? "passage" : "passages"}`;

    return [
        kind,
        formatBytes({ bytes: document.size }),
        state,
        document.created_at ? `Added ${checkedAgo({ at: document.created_at })}` : "",
    ]
        .filter(Boolean)
        .join(" · ");
}
