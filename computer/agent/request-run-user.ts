import type { ServerResponse } from "node:http";
import { AgentState } from "./agent-state";
import ensureRunUser from "./ensure-run-user";
import runUserFor, { type RunUser } from "./run-user-for";
import sendJson from "./send-json";

/**
 * The worker account a request asks to act as (`run_as: { bot_id,
 * workspace_id? }`), set up and ready, or null for gem's own (the
 * coordinator, the app's own commands). For a bad id, and while worker
 * accounts can't be kept off the services (`AgentState.workers_guarded`:
 * acting as one then isn't safe), it answers the request with the error
 * itself and returns undefined.
 */
export default async function requestRunUser({ res, run_as }: { res: ServerResponse; run_as: unknown }): Promise<RunUser | null | undefined> {
    if (run_as == null) return null;

    const refuse = ({ status, message }: { status: number; message: string }) => {
        sendJson({ res, status, body: { error: message } });
        return undefined;
    };

    if (typeof run_as != "object") return refuse({ status: 400, message: "run_as must be { bot_id, workspace_id? }." });

    let run_user: RunUser;

    try {
        const { bot_id, workspace_id } = run_as as { bot_id?: unknown; workspace_id?: unknown };

        run_user = runUserFor({ bot_id, workspace_id });
    } catch (error: any) {
        return refuse({ status: 400, message: String(error?.message || error) });
    }

    if (!AgentState.workers_guarded) {
        return refuse({
            message: `This computer can't keep its bots apart, so it runs nothing for a worker bot: its firewall couldn't be set up (${AgentState.guard_error || "unknown error"}). Rebuild the computer from its settings; its container needs NET_ADMIN.`,
            status: 503,
        });
    }

    await ensureRunUser({ run_user });

    return run_user;
}
