type Params = {
    text: string;
    /**
     * What separates a name from its value: `:` for headers, `=` for envs.
     */
    separator: ":" | "=";
};

/**
 * Reads one `Name: value` (or `NAME=value`) per line into a map, for the
 * header and env fields of an MCP server or tool. Blank lines and lines
 * without the separator are skipped; the value is everything after the
 * first one, trimmed.
 */
export default function parseTemplateLines({ text, separator }: Params): Record<string, string> {
    const map: Record<string, string> = {};

    for (const line of text.split("\n")) {
        const at = line.indexOf(separator);
        const name = at > 0 ? line.slice(0, at).trim() : "";

        if (name) map[name] = line.slice(at + 1).trim();
    }

    return map;
}

/**
 * The other way: a map as one `Name: value` (or `NAME=value`) per line.
 */
export function templateLines({ map, separator }: { map?: Record<string, string>; separator: ":" | "=" }) {
    return Object.entries(map || {})
        .map(([name, value]) => `${name}${separator == ":" ? ": " : "="}${value}`)
        .join("\n");
}
