import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabToolsOverview from "@/src/functions/backend/db/extensions/grab-tools-overview";
import grabCrewSettingsServerProps from "../(functions)/grab-crew-settings-server-props";

/**
 * Super admins and admins: admins only choose who gets each tool.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabCrewSettingsServerProps(params);

    if (!settings.props?.person?.id) return settings;

    return {
        props: {
            ...settings.props,
            tools_overview: await grabToolsOverview({ user_id: settings.props.person.id }),
        },
    };
};
