import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import { SettingsDefaultPath } from "@/src/dict/settings-pages-dict";
import userAuth from "@/src/functions/backend/auth/user-auth";
import canListUsers from "@/src/utils/rbac/can-list-users";
import grabUsers from "@/src/functions/backend/db/users/grab-users";
import grabSettingsServerProps from "../(functions)/grab-settings-server-props";

/**
 * For those who may list users (`canListUsers`: super admins, admins);
 * everyone else lands on the general settings.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabSettingsServerProps(params);

    if (!settings.props) return settings;

    const { user_types } = await userAuth({ req: params.req });

    if (!canListUsers({ user_types })) {
        return { redirect: { destination: SettingsDefaultPath, permanent: false } };
    }

    return {
        props: {
            ...settings.props,
            persons: (await grabUsers()).payload || [],
        },
    };
};
