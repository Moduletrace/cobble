import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import { SettingsDefaultPath } from "@/src/dict/settings-pages-dict";
import userAuth from "@/src/functions/backend/auth/user-auth";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import grabSettingsServerProps from "./grab-settings-server-props";

type Params = Parameters<BunextPageServerFn<PagePropsType>>[0];

/**
 * `grabSettingsServerProps` for the pages that manage the crew (bots,
 * workspaces, computers): super admins and admins only, everyone else
 * lands on the general settings.
 */
export default async function grabCrewSettingsServerProps(params: Params) {
    const settings = await grabSettingsServerProps(params);

    if (!settings.props?.person?.id) return settings;

    const { user_types } = await userAuth({ req: params.req });

    if (!canManageCrew({ user_types })) {
        return { redirect: { destination: SettingsDefaultPath, permanent: false }, props: undefined };
    }

    return settings;
}
