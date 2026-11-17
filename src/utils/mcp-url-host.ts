type Params = {
    url: string;
};

/**
 * Why an MCP server's URL can't be saved, or null when its host is fixed.
 * A template in the host (`{{env.HOST}}`, `{{args.x}}`) would let a run pick
 * where the server's secrets are sent, and a member's personal env could
 * repoint it (H6). Templates belong in the path, query or headers, where
 * the host they reach is still readable before anyone approves it.
 */
export default function mcpUrlHostProblem({ url }: Params): string | null {
    const host = url.trim().match(/^(https?):\/\/([^/?#]*)/i)?.[2];

    if (host && (host.includes("{{") || host.includes("}}"))) {
        return `The MCP server's URL must have a fixed host. A template in the host (like {{env.HOST}}) could send its secrets to a different server; put templates in the path, query or headers instead.`;
    }

    return null;
}
