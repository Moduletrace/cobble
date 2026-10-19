import type { PagePropsType, PageQueryObject } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import { SettingsDefaultPath } from "@/src/dict/settings-pages-dict";
import userAuth from "@/src/functions/backend/auth/user-auth";
import grabCrewOptions from "@/src/functions/backend/db/access/grab-crew-options";
import grabUsers from "@/src/functions/backend/db/users/grab-users";
import sanitizeUserBio from "@/src/functions/backend/db/users/sanitize-user-bio";
import canListUsers from "@/src/utils/rbac/can-list-users";
import grabSettingsServerProps from "../../(functions)/grab-settings-server-props";

/**
 * One user's settings, for those who may list users (`canListUsers`):
 * their profile, user types, access and danger zone.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabSettingsServerProps(params);

    if (!settings.props) return settings;

    const { user_types } = await userAuth({ req: params.req });

    if (!canListUsers({ user_types })) {
        return { redirect: { destination: SettingsDefaultPath, permanent: false } };
    }

    const query: PageQueryObject = params.query;
    const target_person = (
        await grabUsers({ user_id: String(query.user_id) })
    ).singleRes;

    if (!target_person?.id) {
        return { redirect: { destination: "/admin/settings/users", permanent: false } };
    }

    return {
        props: {
            ...settings.props,
            target_person: sanitizeUserBio({ user: target_person }),
            ...(await grabCrewOptions()),
        },
    };
};
