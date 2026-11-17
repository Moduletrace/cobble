import { createHash } from "node:crypto";

type Params = {
    /**
     * The server's slug (`mcp_servers.slug`).
     */
    slug: string;
    /**
     * The tool's name on the server.
     */
    name: string;
};

/** The longest tool name providers accept. */
const MaxNameLength = 64;

/**
 * What a bot calls an MCP server's tool: `<slug>__<tool>`, only letters,
 * numbers, `_` and `-`, at most 64 characters (what providers accept).
 *
 * A name longer than that is cut, but two long names that share a prefix
 * would cut to the same string and one would be silently dropped by the
 * caller's dedupe. So a cut name ends in a short hash of the whole name,
 * which keeps them distinct (L10). Names that fit are left as they are.
 */
export default function mcpToolName({ slug, name }: Params) {
    const full = `${slug}__${name.replace(/[^A-Za-z0-9_-]/g, "_")}`;

    if (full.length <= MaxNameLength) return full;

    const suffix = createHash("sha256").update(full).digest("hex").slice(0, 8);

    return `${full.slice(0, MaxNameLength - suffix.length - 1)}_${suffix}`;
}