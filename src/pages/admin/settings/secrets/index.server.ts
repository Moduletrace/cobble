import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import userAuth from "@/src/functions/backend/auth/user-auth";
import grabPersonalSecrets from "@/src/functions/backend/db/envs/grab-personal-secrets";
import grabSettingsServerProps from "../(functions)/grab-settings-server-props";

/**
 * Every user's own personal secrets: keys only, never values.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabSettingsServerProps(params);

    if (!settings.props) return settings;

    const { user } = await userAuth({ req: params.req });

    return {
        props: {
            ...settings.props,
            personal_secrets: user?.id ? await grabPersonalSecrets({ user_id: user.id }) : [],
        },
    };
};
