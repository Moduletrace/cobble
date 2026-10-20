import userAuth from "@/src/functions/backend/auth/user-auth";
import ensureCoordinatorBot from "@/src/functions/backend/db/bots/ensure-coordinator-bot";
import grabBots from "@/src/functions/backend/db/bots/grab-bots";
import ensureMainComputer from "@/src/functions/backend/db/computers/ensure-main-computer";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import type { PagePropsType } from "@/src/types";
import crewRole from "@/src/utils/rbac/crew-role";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import railBots from "@/src/utils/rail-bots";
import railWorkspaces from "@/src/utils/rail-workspaces";

/**
 * Opens a conversation. The super admin lands on the coordinator, which
 * (with the main computer) is created first if the install has none.
 * Anyone else lands on the latest bot they chat with, else their first
 * workspace; with neither, the page says to ask an admin.
 */
export const server: BunextPageServerFn<PagePropsType> = async ({ req }) => {
    const { user, user_types } = await userAuth({ req });

    if (!user?.id) {
        return {
            redirect: {
                destination: "/auth/login",
            },
        };
    }

    if (crewRole({ user_types }) == "super_admin") {
        const coordinator_id = await ensureCoordinatorBot({ user_id: user.id });
        await ensureMainComputer({ user_id: user.id, coordinator_id });

        return { redirect: { destination: `/admin/bots/${coordinator_id}` } };
    }

    const [bots, workspaces] = await Promise.all([
        grabBots({ user_id: user.id }),
        grabUserWorkspaces({ user_id: user.id }),
    ]);

    if (bots[0]?.id) {
        return { redirect: { destination: `/admin/bots/${bots[0].id}` } };
    }

    if (workspaces[0]?.id) {
        return { redirect: { destination: `/admin/workspaces/${workspaces[0].id}` } };
    }

    return { props: { bots: railBots({ bots }), workspaces: railWorkspaces({ workspaces }) } };
};
