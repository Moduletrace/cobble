import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabDbBackups from "@/src/functions/backend/backups/grab-db-backups";
import grabDataBackups from "@/src/functions/backend/backups/grab-data-backups";
import { grabDataBackupRun } from "@/src/functions/backend/backups/data-backup-run";
import { SettingsDefaultPath } from "@/src/dict/settings-pages-dict";
import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabSettingsServerProps from "../../(functions)/grab-settings-server-props";

type Params = Parameters<BunextPageServerFn<PagePropsType>>[0];

/**
 * Shared server props for the `/admin/settings/backups` sub-pages: the
 * saved database snapshots, the whole-data archives and the archive or
 * restore running now, so a reload mid-run picks it back up. Super admins
 * only; everyone else lands on the general settings.
 */
export default async function grabBackupsServerProps(params: Params) {
    const settings = await grabSettingsServerProps(params);

    if (!settings.props) return settings;

    if (!(await grabSuperAdminUser({ req: params.req }))) {
        return {
            redirect: {
                destination: SettingsDefaultPath,
                permanent: false,
            },
        };
    }

    return {
        props: {
            ...settings.props,
            backups: grabDbBackups(),
            data_backups: grabDataBackups(),
            data_backup_run: grabDataBackupRun(),
        },
    };
}
