import type { IncomingMessage } from "node:http";

/**
 * The worker a GET request acts for (`run_as_bot_id`, `run_as_workspace_id`
 * in its query), in `requestRunUser`'s shape, or null for gem's own.
 */
export default function queryRunAs({ req }: { req: IncomingMessage }) {
    const params = new URL(req.url || "/", "http://agent").searchParams;
    const bot_id = params.get("run_as_bot_id");

    if (!bot_id) return null;

    return { bot_id, workspace_id: params.get("run_as_workspace_id") || null };
}
