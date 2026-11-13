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
 * (`requestRunUser`), from its home unless `cwd` is given. It runs until
 * it ends unless the caller gives `timeout_seconds`, and is killed if the
 * caller goes away. Answers `{ output, exit_code, timed_out, truncated }`
 * after a space every `CommandHeartbeatMs` while it runs, so a client that
 * drops a silent connection keeps it.
 */
export default async function handleExec({ req, res }: { req: IncomingMessage; res: ServerResponse }) {
    const body = await readJsonBody({ req, max_bytes: 1024 * 1024 });

    if (typeof body?.command != "string" || !body.command.trim()) {
        return sendJson({ res, status: 400, body: { error: "Give the command." } });
    }

    const run_user = await requestRunUser({ res, run_as: body.run_as });

    if (run_user === undefined) return;

    const asked = Number(body.timeout_seconds);
    /**
     * A command has no time limit unless the caller asks for one: nothing,
     * or 0, means it runs until it ends, the caller goes away (this
     * response closes) or the container stops. A positive value is that
     * many seconds, however long, so a bot's script is never cut short.
     */
    const timeout_seconds = Number.isFinite(asked) && asked > 0 ? Math.ceil(asked) : null;

    const controller = new AbortController();

    res.on("close", () => {
        if (!res.writableFinished) controller.abort();
    });
    /**
     * A heartbeat into a socket the caller closed must not take the agent
     * down, and there's nothing left to send it: stop the command.
     */
    res.on("error", () => controller.abort());

    const home = run_user ? run_user.home : AgentConfig.Home;

    if (res.destroyed) return;

    /**
     * The result goes out as one JSON body once the command ends, which may
     * be hours away, so the answer is opened now and kept alive with a space
     * until then: a client that drops a silent connection (`fetch` does, at
     * about six minutes) would otherwise lose the command's output and think
     * it failed. A space before the document is still JSON.
     */
    res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });

    const heartbeat = setInterval(() => {
        if (!res.destroyed) res.write(" ");
    }, AgentConfig.CommandHeartbeatMs);

    const result = await runCommand({
        command: body.command,
        cwd: typeof body.cwd == "string" && body.cwd.startsWith("/") ? body.cwd : home,
        env: run_user ? workerEnv({ run_user }) : userEnv(),
        ...(run_user ? { as: { uid: run_user.uid, gid: run_user.gid } } : { uid: AgentConfig.Uid, gid: AgentConfig.Gid }),
        timeout_seconds,
        max_output_bytes: AgentConfig.CommandMaxOutputBytes,
        signal: controller.signal,
    });

    clearInterval(heartbeat);

    if (!res.destroyed) res.end(JSON.stringify(result));
}
