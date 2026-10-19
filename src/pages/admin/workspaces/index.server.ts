import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import { AdminHomePath } from "@/src/dict/admin-sections-dict";
import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

/**
 * Opens the user's first workspace, or the bots when they have none.
 */
export const server: BunextPageServerFn<PagePropsType> = async ({ req }) => {
    const { user } = await userAuth({ req });

    if (!user?.id) {
        return { redirect: { destination: "/auth/login" } };
    }

    const first = (await grabUserWorkspaces({ user_id: user.id }))[0];

    return {
        redirect: {
            destination: first?.id
                ? `/admin/workspaces/${first.id}`
                : AdminHomePath,
        },
    };
};
