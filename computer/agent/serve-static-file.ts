import { readFile } from "node:fs/promises";
import type { ServerResponse } from "node:http";
import path from "node:path";

const Types: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".oga": "audio/ogg",
    ".mp3": "audio/mpeg",
    ".woff": "font/woff",
    ".ttf": "font/ttf",
};

type Params = {
    res: ServerResponse;
    /**
     * The folder served (noVNC's).
     */
    root: string;
    /**
     * The path asked for, below it.
     */
    name: string;
};

/**
 * A file from a folder of the image (noVNC), kept inside it and limited to
 * the kinds a web page loads; anything else is a 404. Never cached: the
 * image's version is the only one there is.
 */
export default async function serveStaticFile({ res, root, name }: Params) {
    let decoded = "";

    try {
        decoded = decodeURIComponent(name);
    } catch {
        decoded = "";
    }

    const file = path.resolve(root, `.${path.posix.sep}${decoded}`);
    const type = Types[path.extname(file).toLowerCase()];
    const inside = file.startsWith(`${path.resolve(root)}${path.sep}`);
    const bytes = decoded && type && inside ? await readFile(file).catch(() => null) : null;

    if (!bytes) {
        res.writeHead(404).end();
        return;
    }

    res.writeHead(200, {
        "content-type": type!,
        "content-length": bytes.length,
        "cache-control": "no-cache",
        "x-content-type-options": "nosniff",
    });
    res.end(bytes);
}
