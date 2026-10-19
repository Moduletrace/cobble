import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import grabSettingsServerProps from "../(functions)/grab-settings-server-props";

export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabSettingsServerProps(params);

    if (!settings.props?.person?.id) return settings;

    return {
        props: {
            ...settings.props,
            workspaces: await grabUserWorkspaces({ user_id: settings.props.person.id }),
        },
    };
};
