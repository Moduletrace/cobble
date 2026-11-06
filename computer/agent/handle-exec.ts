import type { IncomingMessage, ServerResponse } from "node:http";
import { AgentConfig } from "./config";
import readJsonBody from "./read-json-body";
import requestRunUser from "./request-run-user";
import runCommand from "./run-command";
import sendJson from "./send-json";
import userEnv from "./user-env";
import workerEnv from "./worker-env";

/**
 * `POST /api/exec` `{ command, timeout_seconds?, cwd?, run_as? }`: runs
 * one bash command as the computer's user (`runCommand`), or with
 * `run_as: { bot_id, workspace_id? }` as that worker bot's own account
 * (`requestRunUser`), from its home unless `cwd` is given. The command is
 * killed if the caller goes away. Answers `{ output, exit_code,
 * timed_out, truncated }`.
 */
export default async function handleExec({ req, res }: { req: IncomingMessage; res: ServerResponse }) {
    const body = await readJsonBody({ req, max_bytes: 1024 * 1024 });

    if (typeof body?.command != "string" || !body.command.trim()) {
        return sendJson({ res, status: 400, body: { error: "Give the command." } });
    }

    const run_user = await requestRunUser({ res, run_as: body.run_as });

    if (run_user === undefined) return;

    const asked = Number(body.timeout_seconds);
    const timeout_seconds = Number.isFinite(asked) && asked > 0
        ? Math.min(Math.ceil(asked), AgentConfig.CommandMaxSeconds)
        : AgentConfig.CommandDefaultSeconds;

    const controller = new AbortController();

    res.on("close", () => {
        if (!res.writableFinished) controller.abort();
    });

    const home = run_user ? run_user.home : AgentConfig.Home;

    const result = await runCommand({
        command: body.command,
        cwd: typeof body.cwd == "string" && body.cwd.startsWith("/") ? body.cwd : home,
        env: run_user ? workerEnv({ run_user }) : userEnv(),
        ...(run_user ? { as: { uid: run_user.uid, gid: run_user.gid } } : { uid: AgentConfig.Uid, gid: AgentConfig.Gid }),
        timeout_seconds,
        max_output_bytes: AgentConfig.CommandMaxOutputBytes,
        signal: controller.signal,
    });

    if (!res.destroyed) sendJson({ res, body: result });
}
