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
    /**
     * Turns an image (a screenshot) into text for the model. Without it,
     * images are noted but not described.
     */
    describeImage?: (image: McpImage) => Promise<string>;
};

/**
 * An MCP tool result as text for the model: text as is, images described,
 * resources by their text or link. Tool messages carry text only, so an
 * image reaches the model as its reading. A result flagged as an error is
 * thrown, so the model gets it as `Error: ...`.
 */
export default async function mcpResultToText({
    result,
    describeImage,
}: Params): Promise<string> {
    const parts = Array.isArray(result.content) ? result.content : [];
    const texts: string[] = [];

    for (const part of parts) {
        texts.push(await partToText({ part, describeImage }));
    }

    const structured = result.structuredContent ?? result.toolResult;

    if (!texts.length && structured !== undefined) {
        texts.push(typeof structured == "string" ? structured : JSON.stringify(structured));
    }

    const text = texts.filter(Boolean).join("\n\n") || "Done. The tool returned nothing.";

    if (result.isError) {
        throw new Error(text);
    }

    return text;
}

async function partToText({
    part,
    describeImage,
}: {
    part: any;
    describeImage?: Params["describeImage"];
}): Promise<string> {
    switch (part?.type) {
        case "text":
            return String(part.text ?? "");

        case "image": {
            if (!describeImage || typeof part.data != "string") {
                return `[Image (${part.mimeType || "unknown type"})]`;
            }

            try {
                return `[Image: ${await describeImage({
                    data: part.data,
                    mime_type: part.mimeType || "image/png",
                })}]`;
            } catch (error: unknown) {
                return `[Image: couldn't be read. ${error instanceof Error ? error.message : String(error)}]`;
            }
        }

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
