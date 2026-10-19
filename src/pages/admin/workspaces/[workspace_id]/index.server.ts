import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBots from "@/src/functions/backend/db/bots/grab-bots";
import grabUserComputers from "@/src/functions/backend/db/computers/grab-user-computers";
import grabBotHarnessOverview from "@/src/functions/backend/db/harness/grab-bot-harness-overview";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import grabWorkspaceBots from "@/src/functions/backend/db/workspaces/grab-workspace-bots";
import grabWorkspaceComputers from "@/src/functions/backend/db/workspaces/grab-workspace-computers";
import { AdminHomePath } from "@/src/dict/admin-sections-dict";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import type { PagePropsType, PageQueryObject } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

/**
 * A workspace's page: its details, crew, computers and models, with the
 * rail showing its crew. Only super admins and admins manage it; a member
 * opens its first bot instead.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const query: PageQueryObject = params.query;
    const { user, user_types } = await userAuth({ req: params.req });

    if (!user?.id) {
        return { redirect: { destination: "/auth/login" } };
    }

    const workspaces = await grabUserWorkspaces({ user_id: user.id });
    const workspace = workspaces.find((w) => String(w.id) == String(query.workspace_id));

    if (!workspace?.id) {
        return { redirect: { destination: AdminHomePath } };
    }

    const workspace_id = Number(workspace.id);

    /**
     * Members don't manage it: they go straight to its first bot.
     */
    if (!canManageCrew({ user_types })) {
        const workspace_bots = await grabWorkspaceBots({ user_id: user.id, workspace_id });

        if (workspace_bots[0]?.id) {
            return { redirect: { destination: `/admin/workspaces/${workspace_id}/bots/${workspace_bots[0].id}` } };
        }

        return { props: { workspaces, workspace, bots: workspace_bots, workspace_bots } };
    }

    const [workspace_bots, all_bots, workspace_computers, computers, workspace_harness_overview] =
        await Promise.all([
            grabWorkspaceBots({ user_id: user.id, workspace_id }),
            grabBots({ user_id: user.id }),
            grabWorkspaceComputers({ workspace_id }),
            grabUserComputers({ user_id: user.id }),
            grabBotHarnessOverview({ workspace_id }).catch(() => null),
        ]);

    return {
        props: {
            workspaces,
            workspace,
            bots: workspace_bots,
            workspace_bots,
            all_bots,
            workspace_computers,
            computers,
            workspace_harness_overview,
        },
    };
};
