import type { IncomingMessage, ServerResponse } from "node:http";
import openRunFile from "./open-run-file";
import queryPath from "./query-path";
import queryRunAs from "./query-run-as";
import requestRunUser from "./request-run-user";
import sendJson from "./send-json";

/**
 * `GET /api/files/download?path=`: the file byte for byte, with its
 * length. When it changes while it's sent, the connection is cut, so the
 * caller sees a short body instead of a mix of two versions. With
 * `run_as_bot_id` (and `run_as_workspace_id`), only inside that worker's
 * own folders (`openRunFile`).
 */
export default async function handleFileDownload({ req, res }: { req: IncomingMessage; res: ServerResponse }) {
    const file = queryPath({ req });

    if (!file) return sendJson({ res, status: 400, body: { error: "Give an absolute path." } });

    const run_user = await requestRunUser({ res, run_as: queryRunAs({ req }) });

    if (run_user === undefined) return;

    const handle = await openRunFile({ file, run_user });
    const before = await handle?.stat().catch(() => null);

    if (!handle || !before) {
        await handle?.close().catch(() => {});
        return sendJson({ res, status: 404, body: { error: "There's no such file." } });
    }

    if (!before.isFile()) {
        await handle.close().catch(() => {});
        return sendJson({ res, status: 400, body: { error: "That isn't a file." } });
    }

    res.writeHead(200, {
        "content-type": "application/octet-stream",
        "content-length": before.size,
        "cache-control": "no-store",
    });

    const stream = handle.createReadStream({ autoClose: false });

    stream.on("error", () => {
        res.destroy();
        handle.close().catch(() => {});
    });
    stream.on("end", async () => {
        const after = await handle.stat().catch(() => null);

        await handle.close().catch(() => {});

        if (!after || after.size != before.size || after.mtimeMs != before.mtimeMs) res.destroy();
    });
    res.on("close", () => {
        if (!stream.readableEnded) handle.close().catch(() => {});
    });
    stream.pipe(res);
}
