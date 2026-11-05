import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import queryPath from "./query-path";
import sendJson from "./send-json";

/**
 * `GET /api/files/download?path=`: the file byte for byte, with its
 * length. When it changes while it's sent, the connection is cut, so the
 * caller sees a short body instead of a mix of two versions.
 */
export default async function handleFileDownload({ req, res }: { req: IncomingMessage; res: ServerResponse }) {
    const file = queryPath({ req });

    if (!file) return sendJson({ res, status: 400, body: { error: "Give an absolute path." } });

    const before = await stat(file).catch(() => null);

    if (!before) return sendJson({ res, status: 404, body: { error: "There's no such file." } });
    if (!before.isFile()) return sendJson({ res, status: 400, body: { error: "That isn't a file." } });

    res.writeHead(200, {
        "content-type": "application/octet-stream",
        "content-length": before.size,
        "cache-control": "no-store",
    });

    const stream = createReadStream(file);

    stream.on("error", () => res.destroy());
    stream.on("end", async () => {
        const after = await stat(file).catch(() => null);

        if (!after || after.size != before.size || after.mtimeMs != before.mtimeMs) res.destroy();
    });
    stream.pipe(res);
}
