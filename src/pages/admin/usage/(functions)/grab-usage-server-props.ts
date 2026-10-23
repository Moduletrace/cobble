import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import { AdminHomePath } from "@/src/dict/admin-sections-dict";
import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUsageOverview from "@/src/functions/backend/db/usage/grab-usage-overview";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import { parseUsageRange } from "../(data)/usage-ranges";

type Params = Parameters<BunextPageServerFn<PagePropsType>>[0];

/**
 * The usage page's data for the period in the address (the default when
 * it carries none). Crew managers only, since it is the whole install's
 * work rather than one user's conversation; everyone else lands on the
 * bots.
 */
export default async function grabUsageServerProps(params: Params) {
    const { user, user_types } = await userAuth({ req: params.req });

    if (!user?.id) {
        return { redirect: { destination: "/auth/login" } };
    }

    if (!canManageCrew({ user_types })) {
        return { redirect: { destination: AdminHomePath } };
    }

    const range = parseUsageRange({ value: params.query?.range });

    return {
        props: {
            usage: await grabUsageOverview({ days: range?.days }).catch(() => null),
        },
    };
}
