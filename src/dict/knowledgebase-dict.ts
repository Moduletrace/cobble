/**
 * How a knowledgebase document came in: an uploaded file, or text written
 * straight into the knowledgebase.
 */
export const KnowledgebaseDocumentSources = [
    { title: "File", value: "file" },
    { title: "Text", value: "text" },
] as const;

export type KnowledgebaseDocumentSource = (typeof KnowledgebaseDocumentSources)[number]["value"];

/**
 * The tools a run gets when it reaches a knowledgebase.
 */
export const SearchKnowledgebaseToolName = "search_knowledgebase";
export const ReadKnowledgebaseDocumentToolName = "read_knowledgebase_document";
