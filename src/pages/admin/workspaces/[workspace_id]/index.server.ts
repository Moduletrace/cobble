import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import grabWorkspaceActivity from "@/src/functions/backend/db/workspaces/grab-workspace-activity";
import grabWorkspaceBots from "@/src/functions/backend/db/workspaces/grab-workspace-bots";
import grabWorkspaceComputers from "@/src/functions/backend/db/workspaces/grab-workspace-computers";
import { AdminHomePath } from "@/src/dict/admin-sections-dict";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import type { PagePropsType, PageQueryObject } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

/**
 * A workspace's dashboard: its picture, context, latest activity, bots and
 * computers, all read-only. Editing lives under Settings. Only super admins
 * and admins see it; a member opens its first bot instead.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const query: PageQueryObject = params.query;
    const { user, user_types } = await userAuth({ req: params.req });

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

    /**
     * Members don't manage it: they go straight to its first bot.
     */
    if (!canManageCrew({ user_types })) {
        const workspace_bots = await grabWorkspaceBots({
            user_id: user.id,
            workspace_id,
        });

        if (workspace_bots[0]?.id) {
            return {
                redirect: {
                    destination: `/admin/workspaces/${workspace_id}/bots/${workspace_bots[0].id}`,
                },
            };
        }

        return {
            props: {
                workspaces,
                workspace,
                bots: workspace_bots,
                workspace_bots,
            },
        };
    }

    const [workspace_bots, workspace_computers, workspace_activity] =
        await Promise.all([
            grabWorkspaceBots({ user_id: user.id, workspace_id }),
            grabWorkspaceComputers({ workspace_id }),
            grabWorkspaceActivity({ user_id: user.id, workspace_id }),
        ]);

    return {
        props: {
            workspaces,
            workspace,
            bots: workspace_bots,
            workspace_bots,
            workspace_computers,
            workspace_activity,
        },
    };
};
