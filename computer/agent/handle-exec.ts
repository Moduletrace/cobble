import type { IncomingMessage, ServerResponse } from "node:http";
import { AgentConfig } from "./config";
import readJsonBody from "./read-json-body";
import runCommand from "./run-command";
import sendJson from "./send-json";
import userEnv from "./user-env";

/**
 * `POST /api/exec` `{ command, timeout_seconds?, cwd? }`: runs one bash
 * command as the computer's user (`runCommand`), from its home unless
 * `cwd` is given. The command is killed if the caller goes away.
 * Answers `{ output, exit_code, timed_out, truncated }`.
 */
export default async function handleExec({ req, res }: { req: IncomingMessage; res: ServerResponse }) {
    const body = await readJsonBody({ req, max_bytes: 1024 * 1024 });

    if (typeof body?.command != "string" || !body.command.trim()) {
        return sendJson({ res, status: 400, body: { error: "Give the command." } });
    }

    const asked = Number(body.timeout_seconds);
    const timeout_seconds = Number.isFinite(asked) && asked > 0
        ? Math.min(Math.ceil(asked), AgentConfig.CommandMaxSeconds)
        : AgentConfig.CommandDefaultSeconds;

    const controller = new AbortController();

    res.on("close", () => {
        if (!res.writableFinished) controller.abort();
    });

    const result = await runCommand({
        command: body.command,
        cwd: typeof body.cwd == "string" && body.cwd.startsWith("/") ? body.cwd : AgentConfig.Home,
        env: userEnv(),
        uid: AgentConfig.Uid,
        gid: AgentConfig.Gid,
        timeout_seconds,
        max_output_bytes: AgentConfig.CommandMaxOutputBytes,
        signal: controller.signal,
    });

    if (!res.destroyed) sendJson({ res, body: result });
}
