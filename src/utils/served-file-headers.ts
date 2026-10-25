type Params = {
    /**
     * The type the file goes out with, e.g. `text/html; charset=utf-8`.
     */
    content_type?: string | null;
};

/**
 * Types a browser runs as a page or script when opened. Files of these
 * types come from users and bots (a report a bot wrote from a scraped
 * site), and they are served from the app's own origin, so opened as they
 * are they would run with the viewer's session.
 */
const ActiveContentTypes = [
    "text/html",
    "application/xhtml+xml",
    "image/svg+xml",
    "text/xml",
    "application/xml",
    "text/javascript",
    "application/javascript",
    "application/ecmascript",
    "text/ecmascript",
    "text/xsl",
];

/**
 * Whether a type is one a browser would run (`ActiveContentTypes`), any
 * `+xml` type included.
 */
export function isActiveContentType({ content_type }: Params) {
    const type = (content_type || "").split(";")[0]!.trim().toLowerCase();

    return ActiveContentTypes.includes(type) || type.endsWith("+xml");
}

/**
 * The headers every user or bot file is served with: never sniffed into
 * another type, and an active one (HTML, SVG, XML, scripts) sandboxed, so
 * it still opens but runs no script and gets an origin of its own instead
 * of the app's. Other types (images, PDFs, audio) are left alone, since a
 * sandbox stops the browser's PDF viewer.
 */
export default function servedFileHeaders({ content_type }: Params): Record<string, string> {
    const headers: Record<string, string> = { "X-Content-Type-Options": "nosniff" };

    if (isActiveContentType({ content_type })) {
        headers["Content-Security-Policy"] = "sandbox";
    }

    return headers;
}
