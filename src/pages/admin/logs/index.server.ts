import { AdminHomePath } from "@/src/dict/admin-sections-dict";
import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

/**
 * Activity (the audit log): super admins only, everyone else lands on the
 * bots.
 */
export const server: BunextPageServerFn<PagePropsType> = async ({ req }) => {
    const user = await grabSuperAdminUser({ req });

    if (!user?.id) {
        return { redirect: { destination: AdminHomePath } };
    }

    return { props: {} };
};
