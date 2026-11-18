import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import { SettingsDefaultPath } from "@/src/dict/settings-pages-dict";
import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabUserComputers from "@/src/functions/backend/db/computers/grab-user-computers";
import grabHostDirectories from "@/src/functions/backend/db/host-directories/grab-host-directories";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import grabSettingsServerProps from "../(functions)/grab-settings-server-props";

/**
 * Super admins only: a mounted folder is on the host machine itself, so who
 * may add one is not a per-user choice. Everyone else lands on the general
 * settings.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabSettingsServerProps(params);

    if (!settings.props) return settings;

    const user = await grabSuperAdminUser({ req: params.req });

    if (!user?.id) {
        return {
            redirect: {
                destination: SettingsDefaultPath,
                permanent: false,
            },
        };
    }

    const user_id = Number(user.id);

    const [host_directories, computers, workspaces] = await Promise.all([
        grabHostDirectories(),
        grabUserComputers({ user_id }),
        grabUserWorkspaces({ user_id }),
    ]);

    return {
        props: {
            ...settings.props,
            host_directories,
            computers,
            workspaces,
        },
    };
};