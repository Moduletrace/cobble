import { stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import queryPath from "./query-path";
import sendJson from "./send-json";

/**
 * `GET /api/files/stat?path=`: `{ exists, type, size, mtime_ms }`.
 */
export default async function handleFileStat({ req, res }: { req: IncomingMessage; res: ServerResponse }) {
    const file = queryPath({ req });

    if (!file) return sendJson({ res, status: 400, body: { error: "Give an absolute path." } });

    const info = await stat(file).catch(() => null);

    if (!info) return sendJson({ res, body: { exists: false } });

    sendJson({
        res,
        body: {
            exists: true,
            type: info.isFile() ? "file" : info.isDirectory() ? "directory" : "other",
            size: info.size,
            mtime_ms: Math.round(info.mtimeMs),
        },
    });
}
