import type { IncomingMessage, ServerResponse } from "node:http";
import { AgentConfig } from "./config";
import sendJson from "./send-json";
import { workspaceUsage } from "./workspace-usage";

/**
 * `GET /api/usage`: how much the computer's workspace holds
 * (`workspaceUsage`). Only the size: what may be written there is the
 * app's call (`grabComputerWorkspaceQuotaBytes`), so changing the limit
 * needs no new container.
 */
export default async function handleUsage({ res }: { req: IncomingMessage; res: ServerResponse }) {
    sendJson({ res, body: { used_bytes: await workspaceUsage(), workspace_dir: AgentConfig.WorkspaceDir } });
}