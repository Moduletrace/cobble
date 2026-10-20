type Params = {
    /**
     * The plain-HTTP request that should move to HTTPS.
     */
    request_url: URL;
    /**
     * The port the app serves HTTPS on.
     */
    https_port: string | number;
};

/**
 * The HTTPS address for a plain-HTTP request: same host, path and query,
 * on the HTTPS port. `request_url.hostname` keeps the brackets of an IPv6
 * literal, so the result stays a valid URL.
 */
export default function buildHttpsRedirectUrl({
    request_url,
    https_port,
}: Params): string {
    return `https://${request_url.hostname}:${https_port}${request_url.pathname}${request_url.search}`;
}
