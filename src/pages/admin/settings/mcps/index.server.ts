import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabMcpsOverview from "@/src/functions/backend/db/extensions/grab-mcps-overview";
import grabCrewSettingsServerProps from "../(functions)/grab-crew-settings-server-props";

/**
 * Super admins and admins: admins only choose who gets each server.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabCrewSettingsServerProps(params);

    if (!settings.props?.person?.id) return settings;

    return {
        props: {
            ...settings.props,
            mcps_overview: await grabMcpsOverview({ user_id: settings.props.person.id }),
        },
    };
};
