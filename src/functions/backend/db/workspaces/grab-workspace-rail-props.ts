import type { WorkspaceWithActivity, BotWithLastMessage } from "@/src/types";
import railBots from "@/src/utils/rail-bots";
import railWorkspaces from "@/src/utils/rail-workspaces";
import grabBots from "../bots/grab-bots";
import grabUserWorkspaces from "./grab-user-workspaces";

type Params = {
    user_id: number | string;
    workspace_id: number | string;
};

export type WorkspaceRailProps = {
    workspaces: WorkspaceWithActivity[];
    workspace: WorkspaceWithActivity;
    bots: BotWithLastMessage[];
};

/**
 * What a page inside a workspace carries for the rail: the user's
 * workspaces, the open one and its crew. Null when the user doesn't reach
 * that workspace.
 */
export default async function grabWorkspaceRailProps({ user_id, workspace_id }: Params): Promise<WorkspaceRailProps | null> {
    const workspaces = await grabUserWorkspaces({ user_id });
    const workspace = workspaces.find((item) => String(item.id) == String(workspace_id));

    if (!workspace?.id) return null;

    const bots = await grabBots({ user_id, workspace_id: workspace.id });

    return {
        workspaces: railWorkspaces({ workspaces }),
        workspace,
        bots: railBots({ bots }),
    };
}
