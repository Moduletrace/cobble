type Params = {
    /**
     * Where the passage is from, e.g. "Product handbook / pricing.md".
     */
    source: string;
    document_id: number;
    /**
     * Where in the document, e.g. "passage 3".
     */
    at: string;
    text: string;
};

/**
 * One knowledgebase passage for a bot to read, fenced so nothing inside it
 * reads as the app's own words.
 */
export default function knowledgebasePassageBlock({ source, document_id, at, text }: Params) {
    const body = text.trim();
    const longest_run = Math.max(0, ...(body.match(/`+/g) || []).map((run) => run.length));
    const fence = "`".repeat(Math.max(3, longest_run + 1));

    return [`From ${source} (document ${document_id}, ${at}):`, fence, body, fence].join("\n");
}
