import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserWorkspace from "@/src/functions/backend/db/workspaces/grab-user-workspace";
import grabWorkspaceBots from "@/src/functions/backend/db/workspaces/grab-workspace-bots";
import { AdminHomePath } from "@/src/dict/admin-sections-dict";
import type { PagePropsType, PageQueryObject } from "@/src/types";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

/**
 * The workspace's old landing page. Management moved to
 * `/admin/settings/workspaces/<id>`: managers go there, members go to the
 * workspace's first bot. No page renders.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const query: PageQueryObject = params.query;
    const { user, user_types } = await userAuth({ req: params.req });

    if (!user?.id) {
        return { redirect: { destination: "/auth/login" } };
    }

    const workspace = await grabUserWorkspace({
        workspace_id: String(query.workspace_id),
        user_id: user.id,
    });

    if (!workspace?.id) {
        return { redirect: { destination: AdminHomePath, permanent: false } };
    }

    const workspace_id = Number(workspace.id);

    if (canManageCrew({ user_types })) {
        return {
            redirect: {
                destination: `/admin/settings/workspaces/${workspace_id}`,
                permanent: false,
            },
        };
    }

    const workspace_bots = await grabWorkspaceBots({
        user_id: user.id,
        workspace_id,
    });

    return {
        redirect: {
            destination: workspace_bots[0]?.id
                ? `/admin/workspaces/${workspace_id}/bots/${workspace_bots[0].id}`
                : AdminHomePath,
            permanent: false,
        },
    };
};
