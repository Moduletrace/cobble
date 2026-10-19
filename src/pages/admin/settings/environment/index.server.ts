import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import { SettingsDefaultPath } from "@/src/dict/settings-pages-dict";
import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabEnvsOverview from "@/src/functions/backend/db/envs/grab-envs-overview";
import grabSettingsServerProps from "../(functions)/grab-settings-server-props";

/**
 * Super admins only; everyone else lands on the general settings.
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

    return {
        props: {
            ...settings.props,
            envs_overview: await grabEnvsOverview({ user_id: Number(user.id) }),
        },
    };
};
