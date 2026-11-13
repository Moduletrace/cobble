import type { IncomingMessage, ServerResponse } from "node:http";
import { AgentConfig } from "./config";
import sendJson from "./send-json";
import { workspaceUsage } from "./workspace-usage";

/**
 * `GET /api/usage`: what the computer's workspace holds, and its biggest
 * folders (`workspaceUsage`). Only sizes: what may be written there is the
 * app's call (`grabComputerWorkspaceQuotaBytes`), so changing the limit
 * needs no new container. The folders are how a full one is told apart from
 * a bot's own overrun, which the app says in its refusal.
 */
export default async function handleUsage({ res }: { req: IncomingMessage; res: ServerResponse }) {
    const { bytes, folders } = await workspaceUsage();

    sendJson({
        res,
        body: { used_bytes: bytes, workspace_dir: AgentConfig.WorkspaceDir, folders },
    });
}