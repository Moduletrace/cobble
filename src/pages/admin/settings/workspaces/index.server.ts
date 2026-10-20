import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import grabCrewSettingsServerProps from "../(functions)/grab-crew-settings-server-props";
import railWorkspaces from "@/src/utils/rail-workspaces";

export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabCrewSettingsServerProps(params);

    if (!settings.props?.person?.id) return settings;

    return {
        props: {
            ...settings.props,
            workspaces: railWorkspaces({
                workspaces: await grabUserWorkspaces({ user_id: settings.props.person.id }),
            }),
        },
    };
};
