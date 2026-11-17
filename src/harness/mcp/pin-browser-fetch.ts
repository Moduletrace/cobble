type Params = {
    /**
     * The endpoint as the user wrote it, whose hostname was checked.
     */
    endpoint: URL;
    /**
     * The addresses `assertBrowserUrl` checked and allowed. The connection
     * uses these rather than resolving the name again.
     */
    addresses: string[];
};

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

/**
 * A fetch that connects a browser's MCP endpoint to the exact IP that was
 * checked, never to whatever the name resolves to a moment later. A name
 * that answers a public address at save time and a computer's address at
 * connect time (DNS rebinding) would otherwise walk straight past the
 * check. The original Host header and TLS name are kept, so a server that
 * hosts several names still answers for the right one.
 */
export default function pinBrowserFetch({ endpoint, addresses }: Params): FetchLike {
    const ip = addresses[0]!;
    const pinned = ip.includes(":") ? `[${ip}]` : ip;
    const host = endpoint.host;
    const server_name = endpoint.hostname.replace(/^\[|\]$/g, "");

    return (input, init) => {
        const url = new URL(typeof input == "string" ? input : input instanceof URL ? input.href : input.url);

        url.hostname = pinned;

        const headers = new Headers(init?.headers);

        headers.set("Host", host);

        const tls = url.protocol == "https:" ? { serverName: server_name } : undefined;

        return fetch(url, { ...init, headers, tls } as RequestInit);
    };
}
