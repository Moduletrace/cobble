import type { PublicKnowledgebase } from "@/src/types";
import formatBytes from "@/src/utils/format-bytes";

type Params = {
    knowledgebase: Pick<
        PublicKnowledgebase,
        "document_count" | "pending_count" | "error_count" | "stale_count" | "size"
    >;
};

/**
 * What a knowledgebase holds and how much of it bots can search, in a few
 * words: "3 documents · 1.2 MB · 1 being read · 1 needs re-indexing".
 */
export default function knowledgebaseSummary({ knowledgebase }: Params) {
    const { document_count, pending_count, error_count, stale_count, size } = knowledgebase;

    if (!document_count) return "No documents yet";

    return [
        `${document_count} ${document_count == 1 ? "document" : "documents"}`,
        formatBytes({ bytes: size }),
        pending_count ? `${pending_count} being read` : "",
        error_count ? `${error_count} couldn't be read` : "",
        stale_count ? `${stale_count} ${stale_count == 1 ? "needs" : "need"} re-indexing` : "",
    ]
        .filter(Boolean)
        .join(" · ");
}
