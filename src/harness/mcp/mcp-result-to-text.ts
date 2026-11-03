export type McpImage = {
    /**
     * Base64.
     */
    data: string;
    mime_type: string;
};

type Params = {
    /**
     * A `tools/call` result.
     */
    result: {
        content?: unknown;
        structuredContent?: unknown;
        isError?: unknown;
        /**
         * Old servers (protocol 2024-10-07) answer with this instead.
         */
        toolResult?: unknown;
    };
};

/**
 * An MCP tool result for the model: text as is, resources by their text or
 * link, and images (screenshots) handed back beside the text, each marked
 * where it was. Tool messages carry text only, so the run shows the images
 * after the results, read first for a model that can't see. A result
 * flagged as an error is thrown, so the model gets it as `Error: ...`.
 */
export default function mcpResultToText({ result }: Params): { text: string; images: McpImage[] } {
    const parts = Array.isArray(result.content) ? result.content : [];
    const texts: string[] = [];
    const images: McpImage[] = [];

    for (const part of parts) {
        if (part?.type == "image" && typeof part.data == "string" && part.data) {
            images.push({ data: part.data, mime_type: part.mimeType || "image/png" });
            texts.push(`[Image ${images.length}: shown after the tool results]`);
            continue;
        }

        texts.push(partToText({ part }));
    }

    const structured = result.structuredContent ?? result.toolResult;

    if (!texts.length && structured !== undefined) {
        texts.push(typeof structured == "string" ? structured : JSON.stringify(structured));
    }

    const text = texts.filter(Boolean).join("\n\n") || "Done. The tool returned nothing.";

    if (result.isError) {
        throw new Error(text);
    }

    return { text, images };
}

function partToText({ part }: { part: any }): string {
    switch (part?.type) {
        case "text":
            return String(part.text ?? "");

        case "image":
            return `[Image (${part.mimeType || "unknown type"}), empty]`;

        case "audio":
            return `[Audio (${part.mimeType || "unknown type"})]`;

        case "resource":
            return typeof part.resource?.text == "string"
                ? part.resource.text
                : `[File: ${part.resource?.uri || "unnamed"}]`;

        case "resource_link":
            return `[Link: ${part.name || part.uri} ${part.uri || ""}]`.trim();

        default:
            return "";
    }
}
