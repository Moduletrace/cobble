import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabUserComputers from "@/src/functions/backend/db/computers/grab-user-computers";
import grabCrewSettingsServerProps from "../(functions)/grab-crew-settings-server-props";

export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabCrewSettingsServerProps(params);

    if (!settings.props?.person?.id) return settings;

    return {
        props: {
            ...settings.props,
            computers: await grabUserComputers({ user_id: settings.props.person.id }),
        },
    };
};
