import type { IncomingMessage } from "node:http";
import path from "node:path";

/**
 * The absolute, normalised `path` a request names in its query, or null.
 */
export default function queryPath({ req }: { req: IncomingMessage }) {
    const value = new URL(req.url || "/", "http://agent").searchParams.get("path") || "";

    if (!value.startsWith("/") || value.includes("\0")) return null;

    return path.posix.normalize(value);
}
