import userAuth from "@/src/functions/backend/auth/user-auth";
import grabCronJobs from "@/src/functions/backend/db/cron-jobs/grab-cron-jobs";
import grabBotHooks from "@/src/functions/backend/db/bot-hooks/grab-bot-hooks";
import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

/**
 * The routines page: every schedule and hook the user's bots have.
 */
export const server: BunextPageServerFn<PagePropsType> = async ({ req }) => {
    const { user } = await userAuth({ req });

    if (!user?.id) {
        return { redirect: { destination: "/auth/login" } };
    }

    const [cron_jobs, bot_hooks] = await Promise.all([
        grabCronJobs({ user_id: user.id }),
        grabBotHooks({ user_id: user.id }),
    ]);

    return { props: { cron_jobs, bot_hooks } };
};
