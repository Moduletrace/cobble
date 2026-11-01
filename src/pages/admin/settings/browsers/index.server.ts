import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBrowsers from "@/src/functions/backend/db/browsers/grab-browsers";
import grabSettingsServerProps from "../(functions)/grab-settings-server-props";

/**
 * Every user's own browsers. Nobody sees anyone else's, super admins
 * included: a browser holds its owner's logins.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabSettingsServerProps(params);

    if (!settings.props) return settings;

    const { user } = await userAuth({ req: params.req });

    return {
        props: {
            ...settings.props,
            browsers: user?.id ? await grabBrowsers({ user_id: user.id }) : [],
        },
    };
};
