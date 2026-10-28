import withLastVisitedWorkspaceCookies from "@/src/functions/server/with-last-visited-workspace-cookies";
import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import grabWorkspaceActivity from "@/src/functions/backend/db/workspaces/grab-workspace-activity";
import grabWorkspaceBots from "@/src/functions/backend/db/workspaces/grab-workspace-bots";
import grabWorkspaceComputers from "@/src/functions/backend/db/workspaces/grab-workspace-computers";
import grabTasks from "@/src/functions/backend/db/tasks/grab-tasks";
import { AdminHomePath } from "@/src/dict/admin-sections-dict";
import type { PagePropsType, PageQueryObject } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import railBots from "@/src/utils/rail-bots";
import railWorkspaces from "@/src/utils/rail-workspaces";

/**
 * A workspace's dashboard: its picture, context, latest activity, bots and
 * computers, all read-only. Everyone who reaches the workspace sees it; editing lives
 * under Settings, for super admins and admins only.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const query: PageQueryObject = params.query;
    const { user } = await userAuth({ req: params.req });

    if (!user?.id) {
        return { redirect: { destination: "/auth/login" } };
    }

    const workspaces = await grabUserWorkspaces({ user_id: user.id });
    const workspace = workspaces.find(
        (item) => String(item.id) == String(query.workspace_id),
    );

    if (!workspace?.id) {
        return { redirect: { destination: AdminHomePath } };
    }

    const workspace_id = Number(workspace.id);

    const [workspace_bots, workspace_computers, workspace_activity, workspace_tasks] =
        await Promise.all([
            grabWorkspaceBots({ user_id: user.id, workspace_id }),
            grabWorkspaceComputers({ workspace_id }),
            grabWorkspaceActivity({ user_id: user.id, workspace_id }),
            grabTasks({ user_id: user.id, only_workspace_id: workspace_id }),
        ]);

    const crew = railBots({ bots: workspace_bots });

    return {
        props: {
            workspaces: railWorkspaces({ workspaces }),
            workspace,
            bots: crew,
            workspace_bots: crew,
            workspace_computers,
            workspace_activity,
            workspace_tasks,
        },
        res_transform(res) {
            return withLastVisitedWorkspaceCookies({ req: params.req, res, workspace_id });
        },
    };
};
