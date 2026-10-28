import withLastVisitedWorkspaceCookies from "@/src/functions/server/with-last-visited-workspace-cookies";
import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserChatrooms from "@/src/functions/backend/db/chatrooms/grab-user-chatrooms";
import grabWorkspaceRailProps from "@/src/functions/backend/db/workspaces/grab-workspace-rail-props";
import { AdminHomePath } from "@/src/dict/admin-sections-dict";
import type { PagePropsType, PageQueryObject } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

/**
 * A workspace's chatrooms, open ones first, beside the workspace's rail.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const query: PageQueryObject = params.query;
    const { user } = await userAuth({ req: params.req });

    if (!user?.id) {
        return { redirect: { destination: "/auth/login" } };
    }

    const rail = await grabWorkspaceRailProps({ user_id: user.id, workspace_id: query.workspace_id || 0 });

    if (!rail) {
        return { redirect: { destination: AdminHomePath } };
    }

    const chatrooms = await grabUserChatrooms({ user_id: user.id, workspace_id: Number(rail.workspace.id) });

    return {
        props: { ...rail, chatrooms },
        res_transform(res) {
            return withLastVisitedWorkspaceCookies({ req: params.req, res, workspace_id: Number(rail.workspace.id) });
        },
    };
};
