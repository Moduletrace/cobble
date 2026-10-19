type Params = {
    name: string;
};

/**
 * A server's slug from its name: lowercase letters, numbers and single
 * underscores, at most 24 characters, so its tools' names stay short.
 */
export default function mcpServerSlug({ name }: Params) {
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 24)
        .replace(/_+$/g, "");

    return slug || "mcp";
}
