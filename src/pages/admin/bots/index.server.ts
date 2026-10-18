import userAuth from "@/src/functions/backend/auth/user-auth";
import ensureCoordinatorBot from "@/src/functions/backend/db/bots/ensure-coordinator-bot";
import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

/**
 * Opens the coordinator's conversation, creating the coordinator first if
 * this workspace doesn't have one yet.
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

    return {
        redirect: {
            destination: `/admin/bots/${coordinator_id}`,
        },
    };
};
