import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import { AdminHomePath } from "@/src/dict/admin-sections-dict";
import type { PagePropsType } from "@/src/types";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

/**
 * Opens the user's first workspace: its settings page for managers, its
 * first bot for members. The bots when they have no workspaces.
 */
export const server: BunextPageServerFn<PagePropsType> = async ({ req }) => {
    const { user, user_types } = await userAuth({ req });

    if (!user?.id) {
        return { redirect: { destination: "/auth/login" } };
    }

    const first = (await grabUserWorkspaces({ user_id: user.id }))[0];

    if (!first?.id) {
        return { redirect: { destination: AdminHomePath } };
    }

    return {
        redirect: {
            destination: canManageCrew({ user_types })
                ? `/admin/settings/workspaces/${first.id}`
                : `/admin/workspaces/${first.id}`,
        },
    };
};
