import type { IncomingMessage, ServerResponse } from "node:http";
import openRunFile from "./open-run-file";
import queryPath from "./query-path";
import queryRunAs from "./query-run-as";
import requestRunUser from "./request-run-user";
import sendJson from "./send-json";

/**
 * `GET /api/files/stat?path=`: `{ exists, type, size, mtime_ms }`. With
 * `run_as_bot_id` (and `run_as_workspace_id`), only inside that worker's
 * own folders (`openRunFile`).
 */
export default async function handleFileStat({ req, res }: { req: IncomingMessage; res: ServerResponse }) {
    const file = queryPath({ req });

    if (!file) return sendJson({ res, status: 400, body: { error: "Give an absolute path." } });

    const run_user = await requestRunUser({ res, run_as: queryRunAs({ req }) });

    if (run_user === undefined) return;

    const handle = await openRunFile({ file, run_user });
    const info = await handle?.stat().catch(() => null);

    await handle?.close().catch(() => {});

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
