import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import { SettingsDefaultPath } from "@/src/dict/settings-pages-dict";
import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import ensureDefaultHarnessProvider from "@/src/functions/backend/db/harness/ensure-default-harness-provider";
import grabHarnessOverview from "@/src/functions/backend/db/harness/grab-harness-overview";
import grabSettingsServerProps from "../(functions)/grab-settings-server-props";

/**
 * Super admins only; everyone else lands on the general settings.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
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

    await ensureDefaultHarnessProvider();

    return {
        props: {
            ...settings.props,
            harness_overview: await grabHarnessOverview(),
        },
    };
};
