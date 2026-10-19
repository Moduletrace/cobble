import userAuth from "@/src/functions/backend/auth/user-auth";
import grabCronJobs from "@/src/functions/backend/db/cron-jobs/grab-cron-jobs";
import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

/**
 * The routines page: every schedule the user's bots have.
 */
export const server: BunextPageServerFn<PagePropsType> = async ({ req }) => {
    const { user } = await userAuth({ req });

    if (!user?.id) {
        return { redirect: { destination: "/auth/login" } };
    }

    return { props: { cron_jobs: await grabCronJobs({ user_id: user.id }) } };
};
