import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabDbBackups from "@/src/functions/backend/backups/grab-db-backups";
import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

type Params = Parameters<BunextPageServerFn<PagePropsType>>[0];

/**
 * Shared server props for the `/admin/backups` sub-pages. Super admin only.
 */
export default async function grabBackupsServerProps({ req }: Params) {
    const user = await grabSuperAdminUser({ req });

    if (!user?.id) {
        return {
            redirect: {
                destination: "/admin",
            },
        };
    }

    return {
        props: {
            backups: grabDbBackups(),
        },
    };
}
