import userAuth from "@/src/functions/backend/auth/user-auth";
import ensureCoordinatorBot from "@/src/functions/backend/db/bots/ensure-coordinator-bot";
import ensureMainComputer from "@/src/functions/backend/db/computers/ensure-main-computer";
import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

/**
 * Opens the coordinator's conversation, creating the coordinator and the
 * main computer first if this account doesn't have them yet.
 */
export const server: BunextPageServerFn<PagePropsType> = async ({ req }) => {
    const { user } = await userAuth({ req });

    if (!user?.id) {
        return {
            redirect: {
                destination: "/auth/login",
            },
        };
    }

    const coordinator_id = await ensureCoordinatorBot({ user_id: user.id });
    await ensureMainComputer({ user_id: user.id, coordinator_id });

    return {
        redirect: {
            destination: `/admin/bots/${coordinator_id}`,
        },
    };
};
