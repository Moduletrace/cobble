import { GraphicsLibPrefix } from "@/src/dict/graphics-dict";

type Params = {
    /**
     * The app's origin as the browser reached it, e.g.
     * `https://cobble.example.com`: the only place a graphic loads scripts
     * from, and only its libraries.
     */
    origin: string;
};

/**
 * The headers a bot graphic is served with. Its HTML is a bot's and may
 * carry what a prompt injection put there, so it gets:
 *
 * - `sandbox allow-scripts` without `allow-same-origin`: scripts run (for
 *   charts) but under an origin of its own, so no cookie, storage or API of
 *   the app's is reachable.
 * - no network (`default-src 'none'`, `connect-src 'none'`): nothing it
 *   holds can be sent anywhere, and only the app's graphic libraries load.
 * - framed only by the app (`frame-ancestors 'self'`), never cached.
 */
export default function graphicHeaders({ origin }: Params): Record<string, string> {
    return {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": [
            "sandbox allow-scripts",
            "default-src 'none'",
            `script-src 'unsafe-inline' ${origin}${GraphicsLibPrefix}/`,
            "style-src 'unsafe-inline'",
            "img-src data: blob:",
            "font-src data:",
            "connect-src 'none'",
            "form-action 'none'",
            "base-uri 'none'",
            "frame-ancestors 'self'",
        ].join("; "),
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
        "Cache-Control": "private, no-store",
    };
}
