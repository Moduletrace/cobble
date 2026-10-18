import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBots from "@/src/functions/backend/db/bots/grab-bots";
import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

/**
 * Opens the coordinator's conversation. With no crew yet, renders the empty
 * shell.
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

    const bots = await grabBots({ user_id: user.id });
    const first_bot = bots[0];

    if (first_bot?.id) {
        return {
            redirect: {
                destination: `/admin/bots/${first_bot.id}`,
            },
        };
    }

    return {
        props: {
            bots,
        },
    };
};
