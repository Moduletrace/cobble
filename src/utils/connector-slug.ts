type Params = {
    name: string;
    /**
     * How much room the slug may take. A connector's tools are named
     * `<slug>__<tool>`, and the provider's tool names are long, so this stays
     * short.
     */
    max?: number;
    fallback?: string;
};

/**
 * A connector's (or one of its accounts') slug: lowercase letters, numbers
 * and single hyphens.
 */
export default function connectorSlug({ name, max = 16, fallback = "app" }: Params) {
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, max)
        .replace(/-+$/g, "");

    return slug || fallback;
}