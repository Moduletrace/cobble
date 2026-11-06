import { chown, mkdir, rename, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { AgentConfig } from "./config";
import readJsonBody from "./read-json-body";
import requestRunUser from "./request-run-user";
import sendJson from "./send-json";
import writeFileAs from "./write-file-as";

/**
 * `POST /api/files/write` `{ path, content, encoding?: "utf8" | "base64",
 * mode?, run_as? }`: writes a whole file (through a temporary one, then
 * renamed), creating its folders, all owned by the computer's user, or
 * with `run_as: { bot_id, workspace_id? }` written by that worker bot's
 * own account (`writeFileAs`). `mode` is the file's permission bits as a
 * number (e.g. 384 for 0600).
 */
export default async function handleFileWrite({ req, res }: { req: IncomingMessage; res: ServerResponse }) {
    const body = await readJsonBody({ req, max_bytes: 64 * 1024 * 1024 });
    const file = typeof body?.path == "string" && body.path.startsWith("/") && !body.path.includes("\0")
        ? path.posix.normalize(body.path)
        : null;

    if (!file) return sendJson({ res, status: 400, body: { error: "Give an absolute path." } });
    if (typeof body.content != "string") return sendJson({ res, status: 400, body: { error: "Give the content." } });

    const bytes = Buffer.from(body.content, body.encoding == "base64" ? "base64" : "utf8");
    const mode = Number.isInteger(body.mode) ? Number(body.mode) & 0o777 : 0o644;

    const run_user = await requestRunUser({ res, run_as: body.run_as });

    if (run_user === undefined) return;

    if (run_user) {
        try {
            await writeFileAs({ run_user, file, bytes, mode });
        } catch (error: any) {
            return sendJson({ res, status: 403, body: { error: String(error?.message || error) } });
        }

        return sendJson({ res, body: { ok: true, size: bytes.length } });
    }

    await makeOwnedDirs({ dir: path.posix.dirname(file) });

    const temp = `${file}.cobble-${process.pid}-${Date.now()}`;

    await writeFile(temp, bytes, { mode });
    await chown(temp, AgentConfig.Uid, AgentConfig.Gid);
    await rename(temp, file);

    sendJson({ res, body: { ok: true, size: bytes.length } });
}

/**
 * Creates a folder and its missing parents, each new one owned by the
 * computer's user.
 */
async function makeOwnedDirs({ dir }: { dir: string }) {
    const created = await mkdir(dir, { recursive: true });

    if (!created) return;

    let current = dir;

    while (current.length >= created.length) {
        await chown(current, AgentConfig.Uid, AgentConfig.Gid).catch(() => {});
        current = path.posix.dirname(current);
    }
}
