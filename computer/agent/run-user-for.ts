import path from "node:path";
import { AgentConfig } from "./config";

export type RunUser = {
    name: string;
    uid: number;
    gid: number;
    /**
     * Its home, in the container (the env files live there).
     */
    home: string;
    /**
     * The bot's folder in the workspace, owned by the account.
     */
    bot_dir: string;
    /**
     * The workspace the run is in: its shared folder belongs to this group,
     * which the account joins.
     */
    workspace: { name: string; gid: number; dir: string } | null;
};

/**
 * The account a worker bot's commands run as on this computer
 * (`cb-<bot id>`, no sudo) and, in a workspace, the group its bots share
 * (`cw-<id>`). Throws for an id that isn't a whole number in range.
 */
export default function runUserFor({ bot_id, workspace_id }: { bot_id: unknown; workspace_id?: unknown }): RunUser {
    const bot = runId({ value: bot_id });

    if (!bot) throw new Error("Give the bot's id.");

    const workspace = workspace_id == null || workspace_id === "" || Number(workspace_id) == 0 ? null : runId({ value: workspace_id });

    if (workspace_id != null && workspace_id !== "" && Number(workspace_id) != 0 && !workspace) {
        throw new Error("That workspace id isn't valid.");
    }

    const id = AgentConfig.WorkerIdBase + bot;
    const name = `cb-${bot}`;

    return {
        name,
        uid: id,
        gid: id,
        home: `/home/${name}`,
        bot_dir: path.posix.join(AgentConfig.WorkspaceDir, "bots", String(bot)),
        workspace: workspace
            ? {
                  name: `cw-${workspace}`,
                  gid: AgentConfig.WorkspaceGroupBase + workspace,
                  dir: path.posix.join(AgentConfig.WorkspaceDir, "workspaces", String(workspace)),
              }
            : null,
    };
}

function runId({ value }: { value: unknown }) {
    const id = typeof value == "number" ? value : typeof value == "string" && /^\d+$/.test(value) ? Number(value) : NaN;

    return Number.isSafeInteger(id) && id > 0 && id <= AgentConfig.MaxRunId ? id : null;
}
