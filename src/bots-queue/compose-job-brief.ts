type Params = {
    title?: string | null;
    instructions?: string | null;
    params?: Record<string, unknown>;
};

/**
 * The message a bot gets to start a queued job (markdown): the brief it
 * wrote for itself, its parameters, and how to finish.
 */
export default function composeJobBrief({ title, instructions, params }: Params) {
    const parts = [`# Job: ${title?.trim() || "Untitled"}`];

    if (instructions?.trim()) {
        parts.push(instructions.trim());
    }

    if (params && Object.keys(params).length) {
        parts.push(
            `## Parameters\n\n\`\`\`json\n${JSON.stringify(params, null, 2)}\n\`\`\``,
        );
    }

    parts.push(
        `Work on this until it's done. Then reply to the user with the result: what you did, and anything they need to know or do.`,
    );

    return parts.join("\n\n");
}
