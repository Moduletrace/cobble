type Params = {
    map: Record<string, string>;
};

/**
 * An MCP server's or tool's headers or env for a bot to read: a value built on templates
 * (`{{env.KEY}}`, `Bearer {{env.KEY}}`) is shown, a literal one only as
 * `(set)`, so a key typed straight into a header never reaches a
 * transcript.
 */
export default function describeTemplateMap({ map }: Params) {
    const entries = Object.entries(map);

    if (!entries.length) return "none";

    return entries
        .map(([key, value]) => `${key}: ${isTemplated({ value }) ? value : "(set)"}`)
        .join("; ");
}

/**
 * Whether a value fills in at least one template and its literal rest is
 * no more than a short word like `Bearer`.
 */
function isTemplated({ value }: { value: string }) {
    const rest = value.replace(/\{\{[^}]*\}\}/g, "");

    return rest.length < value.length && /^[A-Za-z\s:-]{0,12}$/.test(rest);
}
