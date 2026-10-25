type Params = {
    current: Record<string, string>;
    /**
     * The entries to set, a null removing one.
     */
    changes?: Record<string, string | null>;
};

/**
 * Applies a bot's header changes to what an MCP server or tool has, so it
 * changes one entry without having to repeat (or ever read) the others.
 */
export default function mergeTemplateMap({ current, changes }: Params) {
    const merged = { ...current };

    for (const [key, value] of Object.entries(changes || {})) {
        if (value === null) delete merged[key];
        else merged[key] = value;
    }

    return merged;
}
